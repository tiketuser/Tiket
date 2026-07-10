import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebaseAdmin";
import { authenticateAgent } from "../../../../lib/agentAuth";
import { waitForPending } from "../../../../lib/agentRelay";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * The agent's long poll — its only inbound-free way of receiving work.
 * Held up to POLL_HOLD_MS; returns a claimed request (200) or nothing (204).
 * Also the agent's heartbeat: lastSeenAt drives the online/offline status in
 * the admin panel and the relay's fast-fail.
 */

const POLL_HOLD_MS = 25_000;
const HEARTBEAT_WRITE_INTERVAL_MS = 30_000;

// lastSeenAt write throttle (per instance — extra writes across instances are harmless).
const lastHeartbeatWrite = new Map<string, number>();

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const agentKey = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const agentId = request.headers.get("x-tiket-agent-id");

  const agent = await authenticateAgent(agentId, agentKey);
  if (!agent) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = Date.now();
  if (adminDb && now - (lastHeartbeatWrite.get(agent.agentId) || 0) > HEARTBEAT_WRITE_INTERVAL_MS) {
    lastHeartbeatWrite.set(agent.agentId, now);
    const heartbeat: Record<string, unknown> = { lastSeenAt: new Date(now) };
    const version = request.headers.get("x-tiket-agent-version");
    const lookupMode = request.headers.get("x-tiket-lookup-mode");
    if (version) heartbeat.agentVersion = version.slice(0, 40);
    if (lookupMode) heartbeat.lookupMode = lookupMode.slice(0, 20);
    adminDb.collection("venue_agents").doc(agent.agentId).update(heartbeat).catch(() => {});
  }

  const claimed = await waitForPending(agent.providerId, agent.agentId, POLL_HOLD_MS);
  if (!claimed) return new NextResponse(null, { status: 204 });

  return NextResponse.json({
    request_id: claimed.requestId,
    kind: claimed.kind,
    path: claimed.path,
    headers: claimed.headers,
    body: claimed.body,
  });
}
