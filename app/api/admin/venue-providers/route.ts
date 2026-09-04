import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebaseAdmin";
import { isAdminFromToken } from "../../../../lib/firebase-admin";
import { invalidateProviderCache } from "../../../../lib/venueVerify";
import { newKeyEntry } from "../../../../lib/providerKeys";

export const dynamic = "force-dynamic";

function getAdminDb() {
  return adminDb;
}

async function getAuthenticatedAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing authorization header", status: 401 };
  }
  const token = authHeader.substring(7);
  try {
    if (!adminAuth) return { error: "Auth unavailable", status: 503 };
    const decoded = await adminAuth.verifyIdToken(token);
    if (!isAdminFromToken(decoded)) return { error: "Forbidden", status: 403 };
    return { ok: true };
  } catch (err) {
    console.error("[venue-providers] token verify error:", err);
    return { error: "Forbidden", status: 403 };
  }
}

/** Config fields shared by POST (create) and PUT (update). */
const CONFIG_FIELDS = [
  "name", "protocol", "connectionMode", "baseUrl", "verifyEndpoint",
  "healthEndpoint", "transferEndpoint", "httpMethod",
  "authType", "authHeaderName", "secondaryCredentialHeaderName",
  "requestBodyTemplate", "responseValidField", "responseValidValue",
  "responseConfidenceField", "responseTicketIdField", "responseOriginalPriceField",
  "responseMatchedFieldsField", "responseUnmatchedFieldsField",
  "barcodePattern", "timeoutMs", "priority", "enabled", "notes",
] as const;

function validateProviderPayload(body: Record<string, unknown>, isUpdate: boolean): string | null {
  const protocol = body.protocol === "tiket_connect" ? "tiket_connect" : "custom";
  const agentMode = body.connectionMode === "agent";

  if (!isUpdate || body.name !== undefined) {
    if (!body.name) return "Missing provider name";
  }
  if (agentMode && protocol !== "tiket_connect") {
    return "Agent connection mode requires the Tiket Connect protocol";
  }
  // Agent-mode providers have no public URL — requests go through the relay.
  if (!agentMode && (!isUpdate || body.baseUrl !== undefined)) {
    if (!body.baseUrl) return "Missing base URL";
    if (typeof body.baseUrl === "string" && !/^https?:\/\//.test(body.baseUrl)) {
      return "Base URL must start with http:// or https://";
    }
  }

  // Tiket Connect derives everything else from the standard — only the custom
  // protocol needs the full declarative mapping.
  if (protocol === "custom" && !isUpdate) {
    if (!body.verifyEndpoint) return "Missing verify endpoint";
    if (!body.authType) return "Missing auth type";
    if (!body.authHeaderName && body.authType !== "hmac") return "Missing auth header name";
    if (body.httpMethod !== "GET" && !body.requestBodyTemplate) return "Missing request body template";
    if (!body.responseValidField) return "Missing response valid field";
  }

  if (body.barcodePattern) {
    try { new RegExp(String(body.barcodePattern)); } catch { return "Invalid barcode pattern (regex)"; }
  }
  return null;
}

function normalizeConfig(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of CONFIG_FIELDS) {
    if (body[field] === undefined) continue;
    out[field] = body[field];
  }
  if (out.protocol !== undefined) {
    out.protocol = out.protocol === "tiket_connect" ? "tiket_connect" : "custom";
  }
  if (out.httpMethod !== undefined) {
    out.httpMethod = out.httpMethod === "GET" ? "GET" : "POST";
  }
  if (out.timeoutMs !== undefined) {
    const t = Number(out.timeoutMs);
    out.timeoutMs = Number.isFinite(t) && t >= 1000 && t <= 30000 ? t : 8000;
  }
  if (out.priority !== undefined) {
    const p = Number(out.priority);
    out.priority = Number.isFinite(p) ? p : 100;
  }
  if (out.connectionMode !== undefined) {
    out.connectionMode = out.connectionMode === "agent" ? "agent" : "direct";
  }
  // Tiket Connect always authenticates via HMAC on the canonical envelope.
  if (out.protocol === "tiket_connect") {
    out.authType = "hmac";
    out.httpMethod = "POST";
    if (!out.verifyEndpoint) out.verifyEndpoint = "/tiket/verify";
    // Endpoints are explicit config (siblingEndpoint derivation is only a
    // legacy-doc fallback). Default them from the verify path's prefix.
    const prefix = String(out.verifyEndpoint).endsWith("/verify")
      ? String(out.verifyEndpoint).slice(0, -"/verify".length)
      : "/tiket";
    if (!out.healthEndpoint) out.healthEndpoint = `${prefix}/health`;
    if (!out.transferEndpoint) out.transferEndpoint = `${prefix}/transfer`;
    if (out.connectionMode === "agent") out.baseUrl = "";
  }
  return out;
}

// GET — list all providers (no secret values returned)
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  // Seed the built-in demo provider if it doesn't exist yet
  const demoRef = db.collection("venue_api_providers").doc("demo");
  const demoSnap = await demoRef.get();
  if (!demoSnap.exists) {
    await demoRef.set({
      name: "מצב הדגמה (Demo)",
      type: "builtin_demo",
      baseUrl: "",
      verifyEndpoint: "",
      authType: "bearer",
      authHeaderName: "",
      hasPrimaryKey: false,
      hasSecondaryKey: false,
      requestBodyTemplate: "",
      responseValidField: "",
      barcodePattern: "",
      enabled: true,
      notes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const snapshot = await db
    .collection("venue_api_providers")
    .orderBy("createdAt", "asc")
    .get();

  const providers = snapshot.docs.map((doc) => {
    const data = doc.data();
    const stats = data.stats || {};
    const calls = Number(stats.calls) || 0;
    return {
      id: doc.id,
      name: data.name,
      type: data.type || "real",
      protocol: data.protocol === "tiket_connect" ? "tiket_connect" : "custom",
      connectionMode: data.connectionMode === "agent" ? "agent" : "direct",
      baseUrl: data.baseUrl,
      verifyEndpoint: data.verifyEndpoint,
      healthEndpoint: data.healthEndpoint || "",
      transferEndpoint: data.transferEndpoint || "",
      httpMethod: data.httpMethod === "GET" ? "GET" : "POST",
      authType: data.authType,
      authHeaderName: data.authHeaderName,
      hasPrimaryKey: data.hasPrimaryKey || false,
      secondaryCredentialHeaderName: data.secondaryCredentialHeaderName || "",
      hasSecondaryKey: data.hasSecondaryKey || false,
      requestBodyTemplate: data.requestBodyTemplate,
      responseValidField: data.responseValidField,
      responseValidValue: data.responseValidValue || "",
      responseConfidenceField: data.responseConfidenceField || "",
      responseTicketIdField: data.responseTicketIdField || "",
      responseOriginalPriceField: data.responseOriginalPriceField || "",
      responseMatchedFieldsField: data.responseMatchedFieldsField || "",
      responseUnmatchedFieldsField: data.responseUnmatchedFieldsField || "",
      barcodePattern: data.barcodePattern || "",
      timeoutMs: Number(data.timeoutMs) || 8000,
      priority: Number.isFinite(Number(data.priority)) ? Number(data.priority) : 100,
      enabled: data.enabled,
      notes: data.notes || "",
      stats: {
        calls,
        verified: Number(stats.verified) || 0,
        rejected: Number(stats.rejected) || 0,
        notFound: Number(stats.notFound) || 0,
        errors: Number(stats.errors) || 0,
        avgLatencyMs: calls > 0 ? Math.round((Number(stats.totalLatencyMs) || 0) / calls) : 0,
        lastUsedAt: stats.lastUsedAt?.toDate?.()?.toISOString() || null,
        lastError: stats.lastError || null,
      },
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    };
  });

  return NextResponse.json({ providers });
}

// POST — create new provider
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const body = await request.json();
  const validationError = validateProviderPayload(body, false);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }
  const { apiKey, secondaryKey } = body;
  // Agent-mode providers may be created before the shared secret exists — the
  // key is generated from the keys panel and handed to the partner with the
  // pairing token.
  if (!apiKey && body.connectionMode !== "agent") {
    return NextResponse.json({ error: "Missing API key / shared secret" }, { status: 400 });
  }

  const now = new Date();
  const config = normalizeConfig(body);

  // Create provider doc (no keys stored here)
  const providerRef = db.collection("venue_api_providers").doc();
  await providerRef.set({
    type: "real",
    verifyEndpoint: "",
    httpMethod: "POST",
    authType: "bearer",
    authHeaderName: "Authorization",
    secondaryCredentialHeaderName: "",
    requestBodyTemplate: "",
    responseValidField: "valid",
    barcodePattern: "",
    timeoutMs: 8000,
    priority: 100,
    notes: "",
    ...config,
    enabled: config.enabled !== false,
    hasPrimaryKey: !!apiKey,
    hasSecondaryKey: !!secondaryKey,
    createdAt: now,
    updatedAt: now,
  });

  // Store secrets in separate collection (Admin SDK only). New providers get
  // the rotation-ready keys[] shape; legacy apiKey is kept in sync.
  const initialKey = apiKey ? newKeyEntry(apiKey) : null;
  await db.collection("venue_api_secrets").doc(providerRef.id).set({
    providerId: providerRef.id,
    apiKey: apiKey || "",
    secondaryKey: secondaryKey || "",
    keys: initialKey ? [initialKey] : [],
    activeKeyId: initialKey?.id || "",
    createdAt: now,
    updatedAt: now,
  });

  invalidateProviderCache();
  return NextResponse.json({ success: true, id: providerRef.id });
}

// PUT — update provider
export async function PUT(request: NextRequest) {
  const auth = await getAuthenticatedAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const body = await request.json();
  const { id, apiKey, secondaryKey } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing provider id" }, { status: 400 });
  }
  const validationError = validateProviderPayload(body, true);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const now = new Date();
  const updateData: Record<string, unknown> = { ...normalizeConfig(body), updatedAt: now };

  // Update hasPrimaryKey / hasSecondaryKey flags if new keys provided
  if (apiKey) updateData.hasPrimaryKey = true;
  if (secondaryKey) updateData.hasSecondaryKey = true;

  await db.collection("venue_api_providers").doc(id).update(updateData);

  // Update secrets if new keys were provided. A pasted apiKey becomes the new
  // active key entry; previous active keys move to "retiring" (still accepted
  // by partners configured with both during rotation).
  if (apiKey || secondaryKey) {
    const secretRef = db.collection("venue_api_secrets").doc(id);
    const secretSnap = await secretRef.get();
    const existing = secretSnap.data() || {};
    const secretUpdate: Record<string, unknown> = { updatedAt: now };
    if (apiKey) {
      const entry = newKeyEntry(apiKey);
      const prior = Array.isArray(existing.keys) ? existing.keys : [];
      secretUpdate.apiKey = apiKey;
      secretUpdate.keys = [
        ...prior.map((k: Record<string, unknown>) =>
          k.status === "active" ? { ...k, status: "retiring" } : k
        ),
        entry,
      ];
      secretUpdate.activeKeyId = entry.id;
    }
    if (secondaryKey) secretUpdate.secondaryKey = secondaryKey;
    if (secretSnap.exists) {
      await secretRef.update(secretUpdate);
    } else {
      await secretRef.set({
        providerId: id,
        apiKey: apiKey || "",
        secondaryKey: secondaryKey || "",
        ...secretUpdate,
        createdAt: now,
      });
    }
  }

  invalidateProviderCache();
  return NextResponse.json({ success: true });
}

// DELETE — remove provider and its secrets
export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing provider id" }, { status: 400 });
  }

  // Check it's not the built-in demo — the demo can be disabled but not deleted
  const providerSnap = await db.collection("venue_api_providers").doc(id).get();
  if (providerSnap.data()?.type === "builtin_demo") {
    return NextResponse.json({ error: "Cannot delete the built-in demo provider" }, { status: 400 });
  }

  const batch = db.batch();
  batch.delete(db.collection("venue_api_providers").doc(id));
  batch.delete(db.collection("venue_api_secrets").doc(id));
  await batch.commit();

  invalidateProviderCache();
  return NextResponse.json({ success: true });
}
