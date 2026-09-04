import { adminDb } from "./firebaseAdmin";
import { AGENT_ONLINE_WINDOW_MS, docToAgentIdentity } from "./agentAuth";

/**
 * Firestore-backed relay between TIKET's engine and Tiket Connect Agents.
 *
 * Agents make OUTBOUND-only connections: they hold a long poll against
 * /api/agent/poll and answer via /api/agent/respond. The engine never talks to
 * an agent directly — it drops a signed protocol envelope into the provider's
 * mailbox (`agent_requests`) and awaits the answer document. The relayed bytes
 * are the exact bytes a direct-mode provider would receive, HMAC and all, so
 * the mailbox (and anyone with access to it) is untrusted by design.
 *
 * Everything here is behind the AgentTransport interface; a dedicated
 * WebSocket relay service can replace the Firestore implementation without
 * touching the engine.
 */

export interface AgentEnvelope {
  kind: "verify" | "transfer" | "ping";
  /** Protocol path the agent should treat this as (e.g. "/tiket/verify"). */
  path: string;
  /** The exact signed headers a direct call would carry. */
  headers: Record<string, string>;
  /** The exact signed body — the agent verifies the HMAC over these bytes. */
  body: string;
}

export interface AgentReply {
  httpStatus: number;
  body: string;
}

export interface AgentStatus {
  online: boolean;
  agentId?: string;
  name?: string;
  agentVersion?: string;
  lookupMode?: string;
  lastSeenAt?: string | null;
}

export interface AgentTransport {
  send(providerId: string, envelope: AgentEnvelope, timeoutMs: number): Promise<AgentReply>;
  status(providerId: string): Promise<AgentStatus>;
}

/** Thrown when no agent for the provider has polled recently — fast fail. */
export class AgentOfflineError extends Error {
  constructor(providerId: string) {
    super(`agent_offline: no connected agent for provider ${providerId}`);
    this.name = "AgentOfflineError";
  }
}

interface PendingRequestDoc {
  providerId: string;
  kind: AgentEnvelope["kind"];
  envelope: { path: string; headers: Record<string, string>; body: string };
  status: "pending" | "claimed" | "answered" | "expired";
  createdAt: Date;
  expiresAt: Date;
  agentId?: string;
  claimedAt?: Date;
  answeredAt?: Date;
  response?: { httpStatus: number; body: string };
  latencyMs?: number;
}

async function firestoreStatus(providerId: string): Promise<AgentStatus> {
  if (!adminDb) return { online: false };
  const snap = await adminDb
    .collection("venue_agents")
    .where("providerId", "==", providerId)
    .where("revoked", "==", false)
    .get();

  let best: AgentStatus = { online: false };
  for (const doc of snap.docs) {
    const agent = docToAgentIdentity(doc.id, doc.data());
    const lastSeenMs = agent.lastSeenAt?.getTime() ?? 0;
    const online = Date.now() - lastSeenMs < AGENT_ONLINE_WINDOW_MS;
    const candidate: AgentStatus = {
      online,
      agentId: agent.agentId,
      name: agent.name,
      agentVersion: agent.agentVersion,
      lookupMode: agent.lookupMode,
      lastSeenAt: agent.lastSeenAt ? agent.lastSeenAt.toISOString() : null,
    };
    // Prefer an online agent; otherwise the most recently seen one.
    if (candidate.online && !best.online) best = candidate;
    else if (candidate.online === best.online && (candidate.lastSeenAt || "") > (best.lastSeenAt || "")) {
      best = candidate;
    } else if (!best.agentId) best = candidate;
  }
  return best;
}

async function firestoreSend(
  providerId: string,
  envelope: AgentEnvelope,
  timeoutMs: number
): Promise<AgentReply> {
  if (!adminDb) throw new Error("database_unavailable");

  const status = await firestoreStatus(providerId);
  if (!status.online) throw new AgentOfflineError(providerId);

  const now = Date.now();
  const requestRef = adminDb.collection("agent_requests").doc();
  await requestRef.set({
    providerId,
    kind: envelope.kind,
    envelope: { path: envelope.path, headers: envelope.headers, body: envelope.body },
    status: "pending",
    createdAt: new Date(now),
    expiresAt: new Date(now + timeoutMs),
  } satisfies Partial<PendingRequestDoc> & Record<string, unknown>);

  return new Promise<AgentReply>((resolve, reject) => {
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      clearTimeout(timer);
      fn();
    };

    const timer = setTimeout(() => {
      finish(() => {
        // Best-effort tombstone so the agent skips it if it polls late.
        requestRef.update({ status: "expired" }).catch(() => {});
        reject(new Error(`agent_timeout: no answer within ${timeoutMs}ms`));
      });
    }, timeoutMs);

    const unsubscribe = requestRef.onSnapshot(
      (snap) => {
        const data = snap.data() as PendingRequestDoc | undefined;
        if (data?.status === "answered" && data.response) {
          finish(() => resolve({ httpStatus: data.response!.httpStatus, body: data.response!.body }));
        }
      },
      (err) => finish(() => reject(err))
    );
  });
}

export const agentTransport: AgentTransport = {
  send: firestoreSend,
  status: firestoreStatus,
};

// ─── Poll-side helpers (used by /api/agent/poll and /api/agent/respond) ──────

export interface ClaimedRequest {
  requestId: string;
  kind: string;
  path: string;
  headers: Record<string, string>;
  body: string;
}

/** Transactionally claim the oldest pending request for a provider. */
async function claimNext(providerId: string, agentId: string): Promise<ClaimedRequest | null> {
  if (!adminDb) return null;
  const db = adminDb;

  const candidates = await db
    .collection("agent_requests")
    .where("providerId", "==", providerId)
    .where("status", "==", "pending")
    .orderBy("createdAt", "asc")
    .limit(5)
    .get();

  for (const doc of candidates.docs) {
    const expiresAt = (doc.data().expiresAt as { toDate?: () => Date })?.toDate?.();
    if (expiresAt && expiresAt.getTime() < Date.now()) {
      doc.ref.update({ status: "expired" }).catch(() => {});
      continue;
    }
    try {
      const claimed = await db.runTransaction(async (tx) => {
        const fresh = await tx.get(doc.ref);
        if (fresh.data()?.status !== "pending") return false;
        tx.update(doc.ref, { status: "claimed", agentId, claimedAt: new Date() });
        return true;
      });
      if (claimed) {
        const data = doc.data() as PendingRequestDoc;
        return {
          requestId: doc.id,
          kind: data.kind,
          path: data.envelope.path,
          headers: data.envelope.headers,
          body: data.envelope.body,
        };
      }
    } catch {
      // lost the race — try the next candidate
    }
  }
  return null;
}

/**
 * Long-poll body: claim immediately if work is waiting; otherwise listen for
 * up to holdMs and claim the first request that appears. Null → reply 204.
 */
export async function waitForPending(
  providerId: string,
  agentId: string,
  holdMs: number
): Promise<ClaimedRequest | null> {
  const immediate = await claimNext(providerId, agentId);
  if (immediate || !adminDb) return immediate;

  return new Promise<ClaimedRequest | null>((resolve) => {
    let settled = false;
    let claiming = false;

    const finish = (value: ClaimedRequest | null) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      clearTimeout(timer);
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), holdMs);

    const unsubscribe = adminDb!
      .collection("agent_requests")
      .where("providerId", "==", providerId)
      .where("status", "==", "pending")
      .limit(1)
      .onSnapshot(
        (snap) => {
          if (snap.empty || settled || claiming) return;
          claiming = true;
          claimNext(providerId, agentId)
            .then((req) => {
              claiming = false;
              if (req) finish(req);
            })
            .catch(() => {
              claiming = false;
            });
        },
        () => finish(null)
      );
  });
}

/** Record the agent's answer. False when the request isn't this agent's to answer. */
export async function recordResponse(
  requestId: string,
  agentId: string,
  httpStatus: number,
  body: string
): Promise<boolean> {
  if (!adminDb) return false;
  const ref = adminDb.collection("agent_requests").doc(requestId);
  try {
    return await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data();
      if (!data || data.status !== "claimed" || data.agentId !== agentId) return false;
      const claimedAt = (data.claimedAt as { toDate?: () => Date })?.toDate?.();
      tx.update(ref, {
        status: "answered",
        answeredAt: new Date(),
        response: { httpStatus, body },
        latencyMs: claimedAt ? Date.now() - claimedAt.getTime() : null,
      });
      return true;
    });
  } catch {
    return false;
  }
}
