import type { User } from "firebase/auth";

/**
 * Client-side admin check — reads the unforgeable `admin` custom claim baked
 * into the user's Firebase ID token. This is the SAME signal the server gates
 * on (`checkIsAdmin` in authMiddleware / `isAdminFromToken`), so the UI and the
 * API can never disagree. Custom claims are set server-side only
 * (`set-admin-claim.js` / `POST /api/admin/users`) and cannot be forged.
 *
 * `forceRefresh` fetches the latest claims from Firebase so a freshly granted
 * admin doesn't have to sign out and back in. Use it on the page gate; the
 * cached token is fine for cosmetic nav-link visibility.
 *
 * This is a UX gate only — it decides what to render/redirect. Real
 * authorization is always enforced server-side on every `/api/admin/*` route.
 */
export async function isAdminUser(
  user: User | null,
  forceRefresh = false
): Promise<boolean> {
  if (!user) return false;
  try {
    const { claims } = await user.getIdTokenResult(forceRefresh);
    return claims.admin === true;
  } catch {
    return false;
  }
}
