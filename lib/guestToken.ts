/**
 * HMAC-signed guest token for unauthenticated checkout flows.
 *
 * Instead of trusting a bare email string from the client (easily spoofed),
 * the server issues a short-lived signed token when a guest starts checkout.
 * The token must be presented on subsequent calls (release-reservation,
 * confirm-payment) and is verified server-side before any action is taken.
 *
 * Token format (base64url): <payload_json>.<hmac_hex>
 * Payload: { email, phone, exp }
 */

import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.GUEST_TOKEN_SECRET;
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours — covers a normal checkout session

function getSecret(): string {
  if (!SECRET) {
    throw new Error("GUEST_TOKEN_SECRET environment variable is not set");
  }
  return SECRET;
}

function toBase64Url(s: string): string {
  return Buffer.from(s).toString("base64url");
}

function fromBase64Url(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export interface GuestTokenPayload {
  email: string;
  phone: string;
  exp: number;
}

/** Issue a new signed guest token valid for TTL_MS. */
export function issueGuestToken(email: string, phone: string): string {
  const payload: GuestTokenPayload = {
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    exp: Date.now() + TTL_MS,
  };
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

/**
 * Verify a guest token.
 * Returns the decoded payload on success, throws on invalid/expired token.
 */
export function verifyGuestToken(token: string): GuestTokenPayload {
  if (!token || typeof token !== "string") {
    throw new Error("Missing guest token");
  }

  const dot = token.lastIndexOf(".");
  if (dot === -1) throw new Error("Malformed guest token");

  const payloadB64 = token.substring(0, dot);
  const providedSig = token.substring(dot + 1);

  // Constant-time comparison to prevent timing attacks
  const expectedSig = sign(payloadB64);
  const a = Buffer.from(providedSig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Invalid guest token signature");
  }

  let payload: GuestTokenPayload;
  try {
    payload = JSON.parse(fromBase64Url(payloadB64));
  } catch {
    throw new Error("Malformed guest token payload");
  }

  if (!payload.email || !payload.phone || !payload.exp) {
    throw new Error("Incomplete guest token payload");
  }

  if (Date.now() > payload.exp) {
    throw new Error("Guest token has expired");
  }

  return payload;
}
