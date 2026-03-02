import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebaseAdmin";

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || "tiketbizzz@gmail.com,admin@tiket.com"
).split(",").map((e) => e.trim());

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
    console.log("[venue-providers] decoded email:", decoded.email, "| ADMIN_EMAILS:", ADMIN_EMAILS);
    const isAdmin = decoded.email ? ADMIN_EMAILS.includes(decoded.email) : false;
    if (!isAdmin) return { error: "Forbidden", status: 403 };
    return { ok: true };
  } catch (err) {
    console.error("[venue-providers] token verify error:", err);
    return { error: "Forbidden", status: 403 };
  }
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
    return {
      id: doc.id,
      name: data.name,
      type: data.type || "real",
      baseUrl: data.baseUrl,
      verifyEndpoint: data.verifyEndpoint,
      authType: data.authType,
      authHeaderName: data.authHeaderName,
      hasPrimaryKey: data.hasPrimaryKey || false,
      secondaryCredentialHeaderName: data.secondaryCredentialHeaderName || "",
      hasSecondaryKey: data.hasSecondaryKey || false,
      requestBodyTemplate: data.requestBodyTemplate,
      responseValidField: data.responseValidField,
      barcodePattern: data.barcodePattern || "",
      enabled: data.enabled,
      notes: data.notes || "",
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
  const {
    name,
    baseUrl,
    verifyEndpoint,
    authType,
    authHeaderName,
    apiKey,
    secondaryCredentialHeaderName,
    secondaryKey,
    requestBodyTemplate,
    responseValidField,
    barcodePattern,
    enabled,
    notes,
  } = body;

  if (!name || !baseUrl || !verifyEndpoint || !authType || !authHeaderName || !requestBodyTemplate || !responseValidField) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const now = new Date();

  // Create provider doc (no keys stored here)
  const providerRef = db.collection("venue_api_providers").doc();
  await providerRef.set({
    name,
    type: "real",
    baseUrl,
    verifyEndpoint,
    authType,
    authHeaderName,
    hasPrimaryKey: !!apiKey,
    secondaryCredentialHeaderName: secondaryCredentialHeaderName || "",
    hasSecondaryKey: !!secondaryKey,
    requestBodyTemplate,
    responseValidField,
    barcodePattern: barcodePattern || "",
    enabled: enabled !== false,
    notes: notes || "",
    createdAt: now,
    updatedAt: now,
  });

  // Store secrets in separate collection (Admin SDK only)
  if (apiKey || secondaryKey) {
    await db.collection("venue_api_secrets").doc(providerRef.id).set({
      providerId: providerRef.id,
      apiKey: apiKey || "",
      secondaryKey: secondaryKey || "",
      createdAt: now,
      updatedAt: now,
    });
  }

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
  const { id, apiKey, secondaryKey, ...rest } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing provider id" }, { status: 400 });
  }

  const now = new Date();

  // Update provider config doc
  const updateData: Record<string, unknown> = { updatedAt: now };
  const allowedFields = [
    "name", "baseUrl", "verifyEndpoint", "authType", "authHeaderName",
    "secondaryCredentialHeaderName", "requestBodyTemplate", "responseValidField",
    "barcodePattern", "enabled", "notes",
  ];
  for (const field of allowedFields) {
    if (rest[field] !== undefined) updateData[field] = rest[field];
  }

  // Update hasPrimaryKey / hasSecondaryKey flags if new keys provided
  if (apiKey) updateData.hasPrimaryKey = true;
  if (secondaryKey) updateData.hasSecondaryKey = true;

  await db.collection("venue_api_providers").doc(id).update(updateData);

  // Update secrets if new keys were provided
  if (apiKey || secondaryKey) {
    const secretRef = db.collection("venue_api_secrets").doc(id);
    const secretSnap = await secretRef.get();
    if (secretSnap.exists) {
      const secretUpdate: Record<string, unknown> = { updatedAt: now };
      if (apiKey) secretUpdate.apiKey = apiKey;
      if (secondaryKey) secretUpdate.secondaryKey = secondaryKey;
      await secretRef.update(secretUpdate);
    } else {
      await secretRef.set({
        providerId: id,
        apiKey: apiKey || "",
        secondaryKey: secondaryKey || "",
        createdAt: now,
        updatedAt: now,
      });
    }
  }

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

  return NextResponse.json({ success: true });
}
