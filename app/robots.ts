import type { MetadataRoute } from "next";
import { SITE_URL, searchIndexingOff } from "@/lib/seo";

// Read per request: one image serves staging and production, and only the
// runtime environment says which one this is.
export const dynamic = "force-dynamic";

/** Never useful in search: APIs, sign-in, and the admin tools. */
const DISALLOW = [
  "/api/",
  "/Admin",
  "/Profile",
  "/approve-tickets",
  "/edit-events",
  "/manage-",
  "/regenerate-tickets",
  "/fix-dates",
  "/migrate",
  "/diagnostic",
  "/DemoData",
];

/** Named so the intent is explicit: assistants may read and cite the site. A
 *  crawler with its own group ignores "*", so each group repeats DISALLOW. */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  if (searchIndexingOff()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
