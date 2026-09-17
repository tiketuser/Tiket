import { Capacitor } from "@capacitor/core";
import { isNative } from "./platform";

/**
 * Over-the-air web-bundle updates (self-hosted on Google Cloud Storage).
 *
 * The native apps ship a *frozen* copy of the web build (`webDir: "out"`, no
 * `server.url`). To sync web/JS/CSS changes to installed apps without waiting on
 * an App Store / Play review, CI publishes the built `out/` bundle to a GCS
 * channel and the app pulls it here on launch and on every foreground.
 *
 * Native shell changes (plugins, entitlements, icon, permission strings) still
 * require a store build — OTA can only replace the web layer.
 *
 * Channel is baked at native-build time via NEXT_PUBLIC_OTA_CHANNEL: a
 * staging-built binary tracks the "staging" channel (TestFlight / Play internal),
 * a main-built binary tracks "production" (App Store / Play production). This is
 * how the apps get a staging-vs-prod split mirroring tiket.co.il.
 *
 * Everything here is best-effort and never throws — a failed check simply means
 * the app keeps running the bundle it already has (same ethos as native-push).
 */

const OTA_BASE_URL =
  process.env.NEXT_PUBLIC_OTA_BASE_URL ||
  "https://storage.googleapis.com/tiket-ota";

const CHANNEL: "staging" | "production" =
  process.env.NEXT_PUBLIC_OTA_CHANNEL === "staging" ? "staging" : "production";

/** The OTA channel this binary was built for (baked at build time). */
export const OTA_CHANNEL = CHANNEL;

/**
 * The version of the web bundle currently running — the OTA version applied by
 * the updater, or "builtin" for the bundle that shipped with the store binary
 * (fresh install, before any OTA update). Used for the on-device build badge so
 * you can confirm a staging push reached the app. Safe on web (returns "builtin").
 */
export async function getOtaBundleVersion(): Promise<string> {
  try {
    if (!isNative() || !Capacitor.isPluginAvailable("CapacitorUpdater")) {
      return "builtin";
    }
    const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
    const current = await CapacitorUpdater.current().catch(() => null);
    return current?.bundle?.version ?? "builtin";
  } catch {
    return "builtin";
  }
}

type Manifest = {
  /** Monotonic build identifier (CI run number). Larger = newer. */
  version: string;
  /** Absolute URL to the bundle .zip. */
  url: string;
  /** Optional integrity checksum verified by the updater plugin. */
  checksum?: string;
  notes?: string;
};

let started = false;
let pendingBundleId: string | null = null;

export function initOtaUpdates(): void {
  if (
    started ||
    !isNative() ||
    !Capacitor.isPluginAvailable("CapacitorUpdater")
  ) {
    return;
  }
  started = true;
  void run();
}

async function run(): Promise<void> {
  try {
    const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
    const { App } = await import("@capacitor/app");

    // Confirm the running bundle booted successfully. This cancels the
    // auto-rollback that arms whenever an OTA update is applied — without it the
    // plugin reverts to the previous bundle on the next launch.
    await CapacitorUpdater.notifyAppReady().catch(() => undefined);

    // Stage any newer bundle now.
    await checkAndStage(CapacitorUpdater);

    // Apply a staged bundle when the app is backgrounded → the swap is seamless
    // (no visible reload) and the user sees the new version on their next open.
    await App.addListener("pause", () => {
      void applyPending(CapacitorUpdater);
    });

    // Reliable fallback: on the next foreground, apply a staged bundle if the
    // background apply didn't take — iOS can suspend the app before the pause
    // handler finishes, so a staged update could otherwise sit forever. Applying
    // while the app is active is dependable (a brief reload). If nothing is
    // staged, look for a newer bundle instead.
    await App.addListener("resume", () => {
      if (pendingBundleId) void applyPending(CapacitorUpdater);
      else void checkAndStage(CapacitorUpdater);
    });
  } catch {
    // OTA must never break the app.
  }
}

async function applyPending(
  CapacitorUpdater: typeof import("@capgo/capacitor-updater").CapacitorUpdater,
): Promise<void> {
  const id = pendingBundleId;
  if (!id) return;
  pendingBundleId = null; // clear first so a failed set() can re-arm below
  try {
    // Swaps the active bundle and reloads the webview to it.
    await CapacitorUpdater.set({ id });
  } catch {
    pendingBundleId = id; // retry on the next pause/resume
  }
}

async function checkAndStage(
  CapacitorUpdater: typeof import("@capgo/capacitor-updater").CapacitorUpdater,
): Promise<void> {
  try {
    if (pendingBundleId) return; // already downloaded, waiting to apply

    const manifest = await fetchManifest();
    if (!manifest?.url || !manifest.version) return;

    const current = await CapacitorUpdater.current().catch(() => null);
    const currentVersion = current?.bundle?.version ?? "builtin";
    if (!isNewer(manifest.version, currentVersion)) return;

    const bundle = await CapacitorUpdater.download({
      url: manifest.url,
      version: manifest.version,
      ...(manifest.checksum ? { checksum: manifest.checksum } : {}),
    });
    pendingBundleId = bundle.id;
  } catch {
    // ignore — retried on the next foreground
  }
}

async function fetchManifest(): Promise<Manifest | null> {
  try {
    const res = await fetch(
      `${OTA_BASE_URL}/ota/${CHANNEL}/manifest.json?ts=${Date.now()}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as Manifest;
  } catch {
    return null;
  }
}

/**
 * Compare monotonic build identifiers. Versions are CI run numbers (integers),
 * but this tolerates dotted forms and treats a non-numeric current version
 * (e.g. the "builtin" bundle on a fresh store install) as older.
 */
function isNewer(candidate: string, current: string): boolean {
  if (candidate === current) return false;
  const a = candidate.split(".").map((n) => parseInt(n, 10));
  const b = current.split(".").map((n) => parseInt(n, 10));
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (Number.isNaN(x) || Number.isNaN(y)) return candidate !== current;
    if (x !== y) return x > y;
  }
  return false;
}
