import type { Metadata } from "next";
import EarlyAccessForm from "./EarlyAccessForm";
import EarlyAccessInfo from "./EarlyAccessInfo";
import { BASE_OPEN_GRAPH, OG_IMAGE } from "@/lib/seo";

const TITLE = "Tiket | כרטיסים יד שנייה להופעות, בקנייה ומכירה מאובטחת";
const DESCRIPTION =
  "טיקט (Tiket) היא פלטפורמה לקנייה ומכירה מאובטחת של כרטיסים יד שנייה להופעות ואירועים בישראל. הופעה סולד-אאוט או שלא תוכלו להגיע? הצטרפו לגישה המוקדמת.";

// While the gate is up this page is the whole public site and is served at
// "/", so "/" is its canonical address. Campaign links (/ig, /fb/dm) and
// /EarlyAccess itself render the same page and point back here too.
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { ...BASE_OPEN_GRAPH, url: "/", title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE.url] },
};

export default function EarlyAccessPage() {
  return (
    <EarlyAccessForm>
      <EarlyAccessInfo />
    </EarlyAccessForm>
  );
}
