import { Capacitor } from "@capacitor/core";

// System-chrome (status bar / navigation bar) helpers for the native apps.
// All functions are safe no-ops on the web and on platforms they don't target.

const CREAM = "#F5F1E8"; // --tk-bg
const INK = "#0A0A0A"; // --tk-ink

const isAndroid = () => Capacitor.getPlatform() === "android";

let chromeInitialized = false;

/**
 * One-time setup, called from MobileShell on every mobile screen mount.
 * Android: draw the webview under the status bar (the WebView reports
 * env(safe-area-inset-top) as 0, so the real inset is published as --sat,
 * which the components read via var(--sat, env(safe-area-inset-top, 0px))),
 * and give the system navigation bar the paper-cream default.
 */
export async function initMobileChrome(): Promise<void> {
  if (!Capacitor.isNativePlatform() || chromeInitialized) return;
  chromeInitialized = true;
  if (!isAndroid()) return;
  try {
    const { StatusBar } = await import("@capacitor/status-bar");
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch (err) {
    console.warn("[native-chrome] status-bar overlay failed:", err);
  }
  try {
    const { SafeArea } = await import("capacitor-plugin-safe-area");
    const { insets } = await SafeArea.getSafeAreaInsets();
    // The overlay flips the window edge-to-edge on both edges, so publish
    // top AND bottom (gesture bar) insets — WebView env() reports 0 for both.
    document.documentElement.style.setProperty("--sat", `${insets.top}px`);
    document.documentElement.style.setProperty("--sab", `${insets.bottom}px`);
  } catch (err) {
    console.warn("[native-chrome] safe-area insets failed:", err);
  }
  await setNavBarInk(false);
}

/**
 * Status-bar icon color per screen: hero screens (dark poster under the
 * clock) need light icons, cream screens need dark icons.
 */
export async function setHeroStatusBar(hero: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: hero ? Style.Dark : Style.Light });
  } catch (err) {
    console.warn("[native-chrome] status-bar style failed:", err);
  }
}

/**
 * Android system navigation bar color: ink while the black buy bar is
 * visible so the bar visually extends behind the gesture area, cream
 * otherwise. iOS handles this in CSS via safe-area padding.
 */
export async function setNavBarInk(ink: boolean): Promise<void> {
  if (!isAndroid()) return;
  try {
    const { NavigationBar } = await import("@capgo/capacitor-navigation-bar");
    await NavigationBar.setNavigationBarColor({ color: ink ? INK : CREAM });
  } catch (err) {
    console.warn("[native-chrome] nav-bar color failed:", err);
  }
}
