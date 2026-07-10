import crypto from "crypto";
import { adminDb } from "./firebaseAdmin";

/**
 * Credentials for the Tiket Connect Agent relay.
 *
 * Two credential kinds, both stored only as SHA-256 hashes:
 *  - enrollment tokens (`agent_enroll_tokens`): one-time, 24h TTL, created by
 *    an admin in the provider UI and pasted into `tiket-agent enroll`;
 *  - agent keys (`venue_agents.keyHash`): long-lived bearer credentials the
 *    agent receives at enrollment and presents on every poll/respond call.
 *
 * The relay is untrusted by design — these credentials only gate access to a
 * provider's request mailbox. Request authenticity is enforced end-to-end by
 * the protocol HMAC, which the agent verifies with the partner-held secret.
 */

export const ENROLL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
/** An agent is "online" if it polled within this window. */
export const AGENT_ONLINE_WINDOW_MS = 90 * 1000;

export interface AgentIdentity {
  agentId: string;
  providerId: string;
  name: string;
  agentVersion: string;
  lookupMode: string;
  lastSeenAt: Date | null;
}

export function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  const asTimestamp = value as { toDate?: () => Date } | null;
  return asTimestamp && typeof asTimestamp.toDate === "function" ? asTimestamp.toDate() : null;
}

export function docToAgentIdentity(
  id: string,
  d: FirebaseFirestore.DocumentData
): AgentIdentity {
  return {
    agentId: id,
    providerId: d.providerId,
    name: d.name || "",
    agentVersion: d.agentVersion || "",
    lookupMode: d.lookupMode || "",
    lastSeenAt: toDate(d.lastSeenAt),
  };
}

/**
 * Exchange a one-time enrollment token for a new agent identity + key.
 * Runs in a transaction so a token can never enroll two agents.
 */
export async function consumeEnrollToken(
  token: string,
  agentMeta: { name?: string; agentVersion?: string; platform?: string; lookupMode?: string }
): Promise<{ agentId: string; agentKey: string; providerId: string } | { error: string }> {
  if (!adminDb) return { error: "database_unavailable" };
  const tokenHash = sha256Hex(token);

  const snap = await adminDb
    .collection("agent_enroll_tokens")
    .where("tokenHash", "==", tokenHash)
    .limit(1)
    .get();
  if (snap.empty) return { error: "invalid_token" };

  const tokenRef = snap.docs[0].ref;
  const agentKey = generateOpaqueToken();
  const agentRef = adminDb.collection("venue_agents").doc();

  try {
    await adminDb.runTransaction(async (tx) => {
      const fresh = await tx.get(tokenRef);
      const data = fresh.data();
      if (!data || data.usedAt) throw new Error("token_used");
      const expiresAt = toDate(data.expiresAt);
      if (!expiresAt || expiresAt.getTime() < Date.now()) throw new Error("token_expired");

      tx.update(tokenRef, { usedAt: new Date(), usedByAgentId: agentRef.id });
      tx.set(agentRef, {
        providerId: data.providerId,
        keyHash: sha256Hex(agentKey),
        name: String(agentMeta.name || "").slice(0, 120),
        agentVersion: String(agentMeta.agentVersion || "").slice(0, 40),
        platform: String(agentMeta.platform || "").slice(0, 40),
        lookupMode: String(agentMeta.lookupMode || "").slice(0, 20),
        enrolledAt: new Date(),
        lastSeenAt: null,
        revoked: false,
      });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "enroll_failed";
    return { error: msg === "token_used" || msg === "token_expired" ? msg : "enroll_failed" };
  }

  const providerId = (await tokenRef.get()).data()?.providerId as string;
  return { agentId: agentRef.id, agentKey, providerId };
}

/** Bearer-auth an agent on poll/respond. Null → respond 401. */
export async function authenticateAgent(
  agentId: string | null,
  agentKey: string | null
): Promise<AgentIdentity | null> {
  if (!adminDb || !agentId || !agentKey) return null;
  const doc = await adminDb.collection("venue_agents").doc(agentId).get();
  const data = doc.data();
  if (!data || data.revoked) return null;
  if (!timingSafeEqualHex(String(data.keyHash || ""), sha256Hex(agentKey))) return null;
  return docToAgentIdentity(doc.id, data);
}
