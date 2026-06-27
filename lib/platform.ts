import { Capacitor, CapacitorHttp } from "@capacitor/core";

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

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = buildApiUrl(path);
  if (isNative()) {
    const method = (init?.method?.toUpperCase() ?? "GET") as string;
    const headers: Record<string, string> = {};
    if (init?.headers instanceof Headers) {
      init.headers.forEach((v, k) => { headers[k] = v; });
    } else if (init?.headers) {
      Object.assign(headers, init.headers as Record<string, string>);
    }
    let data: unknown = undefined;
    const bodyRaw = init?.body;
    if (typeof bodyRaw === "string") {
      try {
        data = JSON.parse(bodyRaw);
      } catch {
        data = bodyRaw;
      }
    } else if (bodyRaw != null) {
      data = bodyRaw;
    }
    const nativeResp = await CapacitorHttp.request({ method, url, headers, data });
    const bodyStr =
      typeof nativeResp.data === "string"
        ? nativeResp.data
        : JSON.stringify(nativeResp.data);
    return new Response(bodyStr, {
      status: nativeResp.status,
      headers: nativeResp.headers as Record<string, string>,
    });
  }
  return fetch(url, init);
}

// Mobile (static export) can't ship dynamic-segment routes — generateStaticParams
// has no build-time list of titles. Branch to query-param routes on native;
// keep the dynamic-segment URL on web for SEO + RSC prefetch.
//
// We also check NEXT_PUBLIC_MOBILE_BUILD because eventHref runs during static
// prerender (Node, no Capacitor), where isNative() is false. Without the env
// check, the bundled HTML has /EventPage/<title> baked in, and Link prefetch
// fails on native with an RSC payload error.
const IS_MOBILE_BUILD =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_MOBILE_BUILD === "1";

export function eventHref(title: string): string {
  const encoded = encodeURIComponent(title);
  return IS_MOBILE_BUILD || isNative()
    ? `/EventPage?t=${encoded}`
    : `/EventPage/${encoded}`;
}

export function searchHref(query: string): string {
  const encoded = encodeURIComponent(query);
  return IS_MOBILE_BUILD || isNative()
    ? `/SearchResults?q=${encoded}`
    : `/SearchResults/${encoded}`;
}
