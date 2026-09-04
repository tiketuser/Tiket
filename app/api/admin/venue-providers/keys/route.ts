import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../../lib/firebaseAdmin";
import { isAdminFromToken } from "../../../../../lib/firebase-admin";
import { invalidateProviderCache } from "../../../../../lib/venueVerify";
import {
  generateSharedSecret,
  newKeyEntry,
  ProviderKeyEntry,
  toKeyInfo,
} from "../../../../../lib/providerKeys";

export const dynamic = "force-dynamic";

/**
 * Signing-key lifecycle for a provider (Tiket Connect rotation).
 *
 * GET    ?providerId=…            → key list (ids + status only, never secrets)
 * POST   { providerId }           → generate a new active key; the secret is
 *                                   returned ONCE in this response. The previous
 *                                   active key becomes "retiring".
 * PATCH  { providerId, keyId, action: "revoke" | "promote" }
 */

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing authorization header", status: 401 };
  }
  try {
    if (!adminAuth) return { error: "Auth unavailable", status: 503 };
    const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
    if (!isAdminFromToken(decoded)) return { error: "Forbidden", status: 403 };
    return { ok: true as const };
  } catch {
    return { error: "Forbidden", status: 403 };
  }
}

function readKeys(data: FirebaseFirestore.DocumentData | undefined): ProviderKeyEntry[] {
  if (!data) return [];
  if (Array.isArray(data.keys) && data.keys.length > 0) return data.keys as ProviderKeyEntry[];
  // Legacy single-secret doc — surface it so the admin sees what exists.
  if (data.apiKey) {
    return [{ id: "legacy", secret: data.apiKey, status: "active", createdAt: data.createdAt }] as ProviderKeyEntry[];
  }
  return [];
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const providerId = new URL(request.url).searchParams.get("providerId");
  if (!providerId) return NextResponse.json({ error: "Missing providerId" }, { status: 400 });

  const snap = await adminDb.collection("venue_api_secrets").doc(providerId).get();
  const data = snap.data();
  return NextResponse.json({
    keys: toKeyInfo(readKeys(data)),
    activeKeyId: data?.activeKeyId || (data?.apiKey ? "legacy" : ""),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const { providerId } = await request.json();
  if (!providerId) return NextResponse.json({ error: "Missing providerId" }, { status: 400 });

  const providerSnap = await adminDb.collection("venue_api_providers").doc(providerId).get();
  if (!providerSnap.exists) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const secret = generateSharedSecret();
  const entry = newKeyEntry(secret);
  const now = new Date();

  const secretRef = adminDb.collection("venue_api_secrets").doc(providerId);
  const secretSnap = await secretRef.get();
  const prior = readKeys(secretSnap.data());

  await secretRef.set(
    {
      providerId,
      keys: [
        ...prior.map((k) => (k.status === "active" ? { ...k, status: "retiring" } : k)),
        entry,
      ],
      activeKeyId: entry.id,
      apiKey: secret, // legacy field mirrors the active key
      updatedAt: now,
      ...(secretSnap.exists ? {} : { createdAt: now }),
    },
    { merge: true }
  );
  await adminDb.collection("venue_api_providers").doc(providerId).update({
    hasPrimaryKey: true,
    updatedAt: now,
  });

  invalidateProviderCache();
  // The only time the secret crosses this API — the admin copies it now or never.
  return NextResponse.json({ keyId: entry.id, secret });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const { providerId, keyId, action } = await request.json();
  if (!providerId || !keyId || !["revoke", "promote"].includes(action)) {
    return NextResponse.json({ error: "Missing providerId / keyId / action" }, { status: 400 });
  }

  const secretRef = adminDb.collection("venue_api_secrets").doc(providerId);
  const snap = await secretRef.get();
  if (!snap.exists) return NextResponse.json({ error: "No secrets for provider" }, { status: 404 });

  const data = snap.data()!;
  const keys = readKeys(data);
  const target = keys.find((k) => k.id === keyId);
  if (!target) return NextResponse.json({ error: "Key not found" }, { status: 404 });

  let activeKeyId = data.activeKeyId || "";
  const updated = keys.map((k) => {
    if (k.id !== keyId) {
      // Promoting one key demotes the current active one.
      return action === "promote" && k.status === "active" ? { ...k, status: "retiring" as const } : k;
    }
    return { ...k, status: action === "revoke" ? ("revoked" as const) : ("active" as const) };
  });

  if (action === "promote") activeKeyId = keyId;
  if (action === "revoke" && activeKeyId === keyId) {
    const fallback = updated.find((k) => k.status === "active") || updated.find((k) => k.status === "retiring");
    activeKeyId = fallback?.id || "";
    if (!activeKeyId) {
      return NextResponse.json(
        { error: "Cannot revoke the only usable key — generate a replacement first" },
        { status: 400 }
      );
    }
  }

  const activeSecret = updated.find((k) => k.id === activeKeyId)?.secret || "";
  await secretRef.set(
    { keys: updated, activeKeyId, apiKey: activeSecret, updatedAt: new Date() },
    { merge: true }
  );

  invalidateProviderCache();
  return NextResponse.json({ success: true, activeKeyId });
}
