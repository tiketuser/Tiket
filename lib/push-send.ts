import admin, { adminDb } from "@/lib/firebaseAdmin";

export type PushPayload = {
  title: string;
  body: string;
  /** Deep-link path inside the app, e.g. "/MyTickets". */
  path?: string;
  data?: Record<string, string>;
};

/**
 * Send a push to every device a user has registered.
 *
 * Tokens FCM reports as unregistered are pruned, otherwise a user who
 * reinstalls accumulates dead tokens forever and every send burns quota.
 * Never throws: a failed notification must not fail the transaction that
 * triggered it.
 */
export async function sendPushToUser(uid: string, payload: PushPayload): Promise<number> {
  try {
    if (!adminDb || admin.apps.length === 0) return 0;

    const snap = await adminDb.collection("users").doc(uid).collection("pushTokens").get();
    if (snap.empty) return 0;

    const entries = snap.docs
      .map((d) => ({ ref: d.ref, token: d.data().token as string }))
      .filter((e) => typeof e.token === "string" && e.token.length > 0);
    if (entries.length === 0) return 0;

    const data: Record<string, string> = { ...(payload.data ?? {}) };
    if (payload.path) data.path = payload.path;

    const response = await admin.messaging().sendEachForMulticast({
      tokens: entries.map((e) => e.token),
      notification: { title: payload.title, body: payload.body },
      data,
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
      android: {
        priority: "high",
        notification: { sound: "default" },
      },
    });

    const dead = response.responses
      .map((r, i) => ({ r, entry: entries[i] }))
      .filter(({ r }) => {
        const code = r.error?.code ?? "";
        return (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token" ||
          code === "messaging/invalid-argument"
        );
      });
    await Promise.all(dead.map(({ entry }) => entry.ref.delete().catch(() => undefined)));

    return response.successCount;
  } catch (error) {
    console.error("sendPushToUser failed:", error);
    return 0;
  }
}
