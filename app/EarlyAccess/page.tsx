import type { Metadata } from "next";
import EarlyAccessForm from "./EarlyAccessForm";

export const metadata: Metadata = {
  title: "הצטרפות לגישה מוקדמת | TIKET",
  description: "קונים ומוכרים כרטיסים באופן מאובטח. השאירו אימייל או טלפון ותקבלו גישה מוקדמת.",
  robots: { index: false, follow: false },
};

export default function EarlyAccessPage() {
  return <EarlyAccessForm />;
}
