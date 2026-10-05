import type { Metadata, Viewport } from "next";
import { Assistant, Heebo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import NavigationLoader from "./components/NavigationLoader/NavigationLoader";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister/ServiceWorkerRegister";
import NativeDiagnostic from "./components/NativeDiagnostic/NativeDiagnostic";
import { Suspense } from "react";
import { BASE_OPEN_GRAPH, OG_IMAGE, SITE_JSON_LD, SITE_URL } from "@/lib/seo";

const assistant = Assistant({
  weight: ["400", "700"],
  style: ["normal"],
  subsets: ["hebrew"],
  display: "swap",
  variable: "--font-assistant",
});

const heebo = Heebo({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["hebrew", "latin"],
  display: "swap",
  variable: "--font-heebo",
});

const jetMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jet-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#6366f1",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Pages that set a title get the brand appended; the rest keep the default.
  title: { default: "Tiket - כרטיסים בקליק", template: "%s | Tiket" },
  description: "פלטפורמת מסחר בכרטיסים לאירועים",
  openGraph: BASE_OPEN_GRAPH,
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  manifest: "/manifest.json",
  appleWebApp: {
    statusBarStyle: "default",
    title: "Tiket",
  },
  // app/favicon.ico is prepended to these by Next. All are cut from the app
  // icon rather than the wide wordmark, which shrinks to a sliver when square.
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    // iOS ignores an SVG here; it needs a PNG.
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        {/* Warm DNS/TLS to Stripe so the checkout card form (Stripe.js +
            PaymentElement config) loads faster once the buyer reaches payment.
            Purely a network hint — no effect on pricing or the payment intent. */}
        <link rel="preconnect" href="https://js.stripe.com" crossOrigin="" />
        <link rel="preconnect" href="https://api.stripe.com" crossOrigin="" />
        <link rel="preconnect" href="https://m.stripe.network" crossOrigin="" />
        <script
          type="application/ld+json"
          // Static, trusted data; "<" is escaped so the JSON can never close
          // the script element early.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(SITE_JSON_LD).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className={`${assistant.variable} ${heebo.variable} ${jetMono.variable}`}>
        <ServiceWorkerRegister />
        <NativeDiagnostic />
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
