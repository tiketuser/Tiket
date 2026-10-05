import type { Metadata } from "next";

/** Public origin. Absolute URLs in metadata, the sitemap and structured data
 *  all point here, so staging or a *.run.app host never names itself. */
export const SITE_URL = "https://tiket.co.il";
export const SITE_NAME = "Tiket";

/** Pages render X-Robots-Tag: noindex and robots.txt blocks everything when
 *  SEARCH_INDEXING is "off", which the pipeline sets on staging. Anything
 *  else, unset included, leaves the site indexable, so a missing variable can
 *  never hide production from search. */
export function searchIndexingOff(): boolean {
  return process.env.SEARCH_INDEXING === "off";
}

export const OG_IMAGE = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: "Tiket - קונים ומוכרים כרטיסים באופן מאובטח",
};

/** Shared by every page that sets its own openGraph, since Next replaces the
 *  whole openGraph object rather than merging it with the layout's. */
export const BASE_OPEN_GRAPH: NonNullable<Metadata["openGraph"]> = {
  type: "website",
  siteName: SITE_NAME,
  locale: "he_IL",
  images: [OG_IMAGE],
};

export const SOCIAL_PROFILES = [
  "https://www.instagram.com/tiket.app/",
  "https://www.facebook.com/tiket.co.il/",
];

/** Who Tiket is, for search engines and AI assistants: one organisation with
 *  its Hebrew name and its social profiles, so they read as one brand. */
export const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: ["טיקט", "tiket.co.il"],
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/icons/icon-512.png`,
      description: "פלטפורמה לקנייה ומכירה מאובטחת של כרטיסים יד שנייה להופעות ואירועים בישראל.",
      sameAs: SOCIAL_PROFILES,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: "טיקט",
      inLanguage: "he-IL",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};
