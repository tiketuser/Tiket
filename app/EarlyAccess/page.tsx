import type { Metadata } from "next";
import EarlyAccessForm from "./EarlyAccessForm";

export const metadata: Metadata = {
  title: "הצטרפות לגישה מוקדמת | tiket.",
  description: "השאירו אימייל ומספר טלפון ותהיו הראשונים לדעת כשטיקט עולה לאוויר.",
  robots: { index: false, follow: false },
};

export default function EarlyAccessPage() {
  return <EarlyAccessForm />;
}
