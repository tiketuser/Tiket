import { auth } from "../firebase";
import { buildApiUrl, getPlatform, isNative } from "./platform";

let initialized = false;

export async function initNativePush(): Promise<void> {
  if (!isNative() || initialized) return;
  initialized = true;

  const { PushNotifications } = await import("@capacitor/push-notifications");

  const permission = await PushNotifications.checkPermissions();
  if (permission.receive === "prompt" || permission.receive === "prompt-with-rationale") {
    const requested = await PushNotifications.requestPermissions();
    if (requested.receive !== "granted") return;
  } else if (permission.receive !== "granted") {
    return;
  }

  await PushNotifications.register();

  await PushNotifications.addListener("registration", async ({ value: token }) => {
    try {
      const user = auth?.currentUser;
      if (!user) return;
      const idToken = await user.getIdToken();

      await fetch(buildApiUrl("/api/notifications/register-token"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token, platform: getPlatform() }),
      });
    } catch {
      // Silent — token will retry on next launch
    }
  });

  await PushNotifications.addListener("registrationError", () => {
    initialized = false;
  });
}
