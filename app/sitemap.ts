import type { MetadataRoute } from "next";
import { EARLY_ACCESS_UPDATED, SITE_URL, searchIndexingOff } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Only what the early-access gate lets through: the landing page and the
 *  pages registered with the app stores. Event pages join at launch. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (searchIndexingOff()) return [];
  return [
    { url: `${SITE_URL}/`, lastModified: EARLY_ACCESS_UPDATED, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/ContactUs`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/Privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/Terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
