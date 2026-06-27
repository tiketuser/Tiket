/**
 * Utility to resolve default category images from Firestore.
 * Uses the client SDK (read-only, public collection) so it works
 * both locally and on Cloud Run without needing Admin credentials.
 */
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

let cache: Record<string, string> | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getDefaultImageMap(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL_MS) return cache;

  if (!db) return {};

  try {
    const snapshot = await getDocs(collection(db as any, "defaultCategoryImages"));
    const map: Record<string, string> = {};
    snapshot.docs.forEach((doc) => {
      const { category, imageData } = doc.data();
      if (category && imageData) map[category] = imageData;
    });
    cache = map;
    cacheTime = now;
    return map;
  } catch (error) {
    console.error("[defaultImages] Failed to fetch default images:", error);
    return cache ?? {};
  }
}

/**
 * Returns the stored default image URL for a category,
 * or empty string if none is set.
 */
const isRealImage = (url: string | undefined): boolean =>
  !!url && !url.startsWith("data:");

// Android WebView won't auto-encode spaces / non-ASCII in <img src>, so a URL
// like ".../Theatre Generic (Compressed).png" 404s on Android while iOS WKWebView
// silently fixes it up. Encode each path segment defensively.
export function encodeImageUrl(url: string): string {
  if (!url || url.startsWith("data:")) return url;
  try {
    const u = new URL(url);
    u.pathname = u.pathname
      .split("/")
      .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
      .join("/");
    return u.toString();
  } catch {
    return url;
  }
}

export async function resolveEventImage(
  imageUrl: string | undefined,
  category: string | undefined
): Promise<string> {
  if (isRealImage(imageUrl)) return encodeImageUrl(imageUrl!);
  const map = await getDefaultImageMap();
  const fallback = map[category ?? ""] ?? map["מוזיקה"] ?? "";
  return encodeImageUrl(fallback);
}
