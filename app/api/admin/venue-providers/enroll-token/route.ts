import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../../lib/firebaseAdmin";
import { isAdminFromToken } from "../../../../../lib/firebase-admin";
import {
  ENROLL_TOKEN_TTL_MS,
  generateOpaqueToken,
  sha256Hex,
} from "../../../../../lib/agentAuth";

export const dynamic = "force-dynamic";

/**
 * Pairing tokens for the Tiket Connect Agent.
 *
 * POST { providerId } → a one-time token (24h TTL), returned ONCE — the admin
 * sends it to the partner, whose agent exchanges it at /api/agent/enroll.
 * GET  ?providerId=…  → outstanding/used tokens (hashes only, never tokens).
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
    return { ok: true as const, uid: decoded.uid };
  } catch {
    return { error: "Forbidden", status: 403 };
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const { providerId } = await request.json();
  if (!providerId) return NextResponse.json({ error: "Missing providerId" }, { status: 400 });

  const provider = await adminDb.collection("venue_api_providers").doc(providerId).get();
  if (!provider.exists) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const token = generateOpaqueToken();
  const now = Date.now();
  await adminDb.collection("agent_enroll_tokens").add({
    providerId,
    tokenHash: sha256Hex(token),
    createdBy: auth.uid,
    createdAt: new Date(now),
    expiresAt: new Date(now + ENROLL_TOKEN_TTL_MS),
    usedAt: null,
    usedByAgentId: null,
  });

  // Shown once — only the hash is stored.
  return NextResponse.json({
    enroll_token: token,
    expires_at: new Date(now + ENROLL_TOKEN_TTL_MS).toISOString(),
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const providerId = new URL(request.url).searchParams.get("providerId");
  if (!providerId) return NextResponse.json({ error: "Missing providerId" }, { status: 400 });

  const snap = await adminDb
    .collection("agent_enroll_tokens")
    .where("providerId", "==", providerId)
    .get();

  const toIso = (v: unknown) =>
    (v as { toDate?: () => Date })?.toDate?.()?.toISOString() ??
    (v instanceof Date ? v.toISOString() : null);

  const tokens = snap.docs
    .map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        createdAt: toIso(d.createdAt),
        expiresAt: toIso(d.expiresAt),
        usedAt: toIso(d.usedAt),
        usedByAgentId: d.usedByAgentId || null,
      };
    })
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  return NextResponse.json({ tokens });
}
