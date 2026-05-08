import { Capacitor } from "@capacitor/core";

export type PlatformName = "ios" | "android" | "web";

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): PlatformName {
  const p = Capacitor.getPlatform();
  if (p === "ios" || p === "android") return p;
  return "web";
}

export function isIOS(): boolean {
  return getPlatform() === "ios";
}

export function isAndroid(): boolean {
  return getPlatform() === "android";
}

const PROD_API = "https://tiket.co.il";

export function apiBaseUrl(): string {
  if (!isNative()) return "";
  return process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL || PROD_API;
}

export function buildApiUrl(path: string): string {
  const base = apiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
