import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import "./globals.css";
import NavigationLoader from "./components/NavigationLoader/NavigationLoader";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister/ServiceWorkerRegister";
import { Suspense } from "react";

const assistant = Assistant({
  weight: ["400", "700"],
  style: ["normal"],
  subsets: ["hebrew"],
  display: "swap",
  variable: "--font-assistant",
});

export const metadata: Metadata = {
  title: "Tiket - כרטיסים בקליק",
  description: "פלטפורמת מסחר בכרטיסים לאירועים",
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tiket",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/images/Home Page/Web/CarusleArrow.svg"
          as="image"
          type="image/svg+xml"
        />
      </head>
      <body className={`${assistant.variable}`}>
        <ServiceWorkerRegister />
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
