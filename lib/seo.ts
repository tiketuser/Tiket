import type { Metadata } from "next";

/** Public origin. Absolute URLs in metadata, the sitemap and structured data
 *  all point here, so staging or a *.run.app host never names itself. */
export const SITE_URL = "https://tiket.co.il";
export const SITE_NAME = "Tiket";

/** When the early-access page's text last changed. Bump it with the copy: it
 *  feeds the sitemap's lastmod and the page's dateModified, which search
 *  engines and AI assistants read as freshness. */
export const EARLY_ACCESS_UPDATED = "2026-10-09";

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
  "https://www.tiktok.com/@therealtiketapp",
  "https://www.youtube.com/@therealtiketapp",
  "https://x.com/tiket_app",
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
      description:
        "פלטפורמה ישראלית לקנייה ומכירה של כרטיסים יד שנייה להופעות ואירועים, עם תשלום שמוחזק בנאמנות עד אחרי האירוע.",
      slogan: "כרטיסים בקליק",
      founder: [
        { "@type": "Person", name: "Ofek Amar" },
        { "@type": "Person", name: "Aviv Nir" },
      ],
      areaServed: { "@type": "Country", name: "Israel" },
      knowsAbout: [
        "כרטיסים יד שנייה",
        "מכירת כרטיסים להופעות",
        "כרטיסים להופעות סולד אאוט",
        "הגנה מעקיצות בקניית כרטיסים",
        "Secondary ticket resale",
      ],
      email: "tiketbizzz@gmail.com",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "tiketbizzz@gmail.com",
        url: `${SITE_URL}/ContactUs`,
        availableLanguage: ["he", "en"],
      },
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
