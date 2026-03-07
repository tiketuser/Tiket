import { cookies, headers } from "next/headers";
import { adminAuth } from "@/lib/firebaseAdmin";

/**
 * Get the verified Firebase UID from the __session cookie.
 *
 * The cookie must contain a valid Firebase ID token (set by the client after
 * Firebase Auth sign-in). We verify it cryptographically with the Admin SDK
 * instead of trusting the raw value.
 *
 * Returns null if the cookie is absent, expired, or tampered with.
 */
export async function getUserIdFromSession(): Promise<string | null> {
  try {
    if (!adminAuth) return null;

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session");

    if (sessionCookie?.value) {
      const decoded = await adminAuth.verifyIdToken(sessionCookie.value);
      return decoded.uid;
    }

    return null;
  } catch {
    // Token invalid, expired, or missing — treat as unauthenticated
    return null;
  }
}

/**
 * Get the verified Firebase UID from the Authorization: Bearer header.
 * Suitable for use in Server Components that receive a request context.
 */
export async function getUserIdFromHeaders(): Promise<string | null> {
  try {
    if (!adminAuth) return null;

    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = await adminAuth.verifyIdToken(token);
      return decoded.uid;
    }

    return null;
  } catch {
    return null;
  }
}
