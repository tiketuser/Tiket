import crypto from "crypto";

/**
 * Provider signing-key lifecycle (Tiket Connect key rotation).
 *
 * Secrets live in `venue_api_secrets/{providerId}` (Admin SDK only):
 *   keys:        [{ id, secret, status: "active" | "retiring" | "revoked", createdAt }]
 *   activeKeyId: id of the key used to sign outgoing requests
 *   apiKey:      legacy single-secret field, kept in sync with the active key so
 *                pre-rotation code paths keep working
 *
 * Rotation is zero-downtime: generating a new key marks the previous active key
 * "retiring" (partners configured with multiple secrets accept either); once the
 * partner confirms the new key, the old one is revoked.
 */

export interface ProviderKeyEntry {
  id: string;
  secret: string;
  status: "active" | "retiring" | "revoked";
  createdAt: Date;
}

/** Public projection — everything except the secret itself. */
export interface ProviderKeyInfo {
  id: string;
  status: ProviderKeyEntry["status"];
  createdAt: string | null;
}

export function generateKeyId(): string {
  return `k_${crypto.randomBytes(4).toString("hex")}`;
}

/** 32 random bytes, base64url — the shared secret handed to the partner once. */
export function generateSharedSecret(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function newKeyEntry(secret: string): ProviderKeyEntry {
  return { id: generateKeyId(), secret, status: "active", createdAt: new Date() };
}

/** Strip secrets for API responses. */
export function toKeyInfo(keys: unknown): ProviderKeyInfo[] {
  if (!Array.isArray(keys)) return [];
  return keys
    .filter((k) => k && typeof k === "object" && (k as ProviderKeyEntry).id)
    .map((k) => {
      const entry = k as ProviderKeyEntry & { createdAt?: unknown };
      const raw = entry.createdAt;
      const created =
        raw instanceof Date
          ? raw
          : raw && typeof (raw as { toDate?: () => Date }).toDate === "function"
          ? (raw as { toDate: () => Date }).toDate()
          : null;
      return {
        id: entry.id,
        status: entry.status || "active",
        createdAt: created ? created.toISOString() : null,
      };
    });
}
