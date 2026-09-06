import { auth } from "../firebase";
import { apiFetch, getPlatform, isNative } from "./platform";

let initialized = false;
let unsubscribeAuth: (() => void) | null = null;

/**
 * Push registration.
 *
 * We use @capacitor-firebase/messaging rather than @capacitor/push-notifications
 * because the backend addresses devices through FCM. On iOS the raw APNs token
 * that @capacitor/push-notifications hands back is NOT an FCM registration
 * token, so sending to it through FCM fails; the Firebase plugin does the
 * APNs -> FCM exchange for us and returns a token that works on both platforms.
 */
export async function initNativePush(): Promise<void> {
  if (!isNative() || initialized) return;
  initialized = true;

  const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");

  let permission = await FirebaseMessaging.checkPermissions();
  if (permission.receive === "prompt" || permission.receive === "prompt-with-rationale") {
    permission = await FirebaseMessaging.requestPermissions();
  }
  if (permission.receive !== "granted") {
    initialized = false;
    return;
  }

  // Token can rotate at any time; always send the current one up.
  await FirebaseMessaging.addListener("tokenReceived", ({ token }) => {
    void sendToken(token);
  });

  // Tapping a notification opens the screen the payload points at.
  await FirebaseMessaging.addListener("notificationActionPerformed", (event) => {
    const data = event.notification?.data as Record<string, unknown> | undefined;
    const path = data?.path;
    if (typeof path === "string" && path.startsWith("/")) {
      window.location.assign(path);
    }
  });

  try {
    const { token } = await FirebaseMessaging.getToken();
    await sendToken(token);
  } catch {
    initialized = false;
    return;
  }

  // A token obtained before sign-in has no user to attach to. Re-send it once
  // the user actually signs in.
  if (!unsubscribeAuth && auth) {
    unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;
      void FirebaseMessaging.getToken()
        .then(({ token }) => sendToken(token))
        .catch(() => undefined);
    });
  }
}

async function sendToken(token: string): Promise<void> {
  try {
    const user = auth?.currentUser;
    if (!user) return;
    const idToken = await user.getIdToken();

    await apiFetch("/api/notifications/register-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ token, platform: getPlatform() }),
    });
  } catch {
    // Silent — the tokenReceived listener and next launch both retry.
  }
}

/**
 * Best-effort: stop this device receiving pushes.
 * Must be called BEFORE signOut() — it needs a valid ID token.
 */
export async function clearNativePushToken(): Promise<void> {
  if (!isNative()) return;
  try {
    const user = auth?.currentUser;
    if (!user) return;
    const idToken = await user.getIdToken();

    const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
    const { token } = await FirebaseMessaging.getToken();
    await apiFetch("/api/notifications/register-token", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ token }),
    });
    await FirebaseMessaging.deleteToken();
    initialized = false;
  } catch {
    // Silent.
  }
}
