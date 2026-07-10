import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../../lib/firebaseAdmin";
import { isAdminFromToken } from "../../../../../lib/firebase-admin";
import { AGENT_ONLINE_WINDOW_MS } from "../../../../../lib/agentAuth";

export const dynamic = "force-dynamic";

/**
 * Enrolled agents for a provider: online status for the admin panel, and
 * revocation (a revoked agent's key stops working on the next poll).
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

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const providerId = new URL(request.url).searchParams.get("providerId");
  if (!providerId) return NextResponse.json({ error: "Missing providerId" }, { status: 400 });

  const snap = await adminDb
    .collection("venue_agents")
    .where("providerId", "==", providerId)
    .get();

  const agents = snap.docs.map((doc) => {
    const d = doc.data();
    const lastSeen = (d.lastSeenAt as { toDate?: () => Date })?.toDate?.() ?? null;
    return {
      id: doc.id,
      name: d.name || "",
      platform: d.platform || "",
      agentVersion: d.agentVersion || "",
      lookupMode: d.lookupMode || "",
      revoked: Boolean(d.revoked),
      enrolledAt: (d.enrolledAt as { toDate?: () => Date })?.toDate?.()?.toISOString() ?? null,
      lastSeenAt: lastSeen ? lastSeen.toISOString() : null,
      online:
        !d.revoked && lastSeen !== null && Date.now() - lastSeen.getTime() < AGENT_ONLINE_WINDOW_MS,
    };
  });

  return NextResponse.json({ agents });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!adminDb) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const { agentId, action } = await request.json();
  if (!agentId || !["revoke", "restore"].includes(action)) {
    return NextResponse.json({ error: "Missing agentId / action" }, { status: 400 });
  }

  const ref = adminDb.collection("venue_agents").doc(agentId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  await ref.update({ revoked: action === "revoke" });
  return NextResponse.json({ success: true });
}
