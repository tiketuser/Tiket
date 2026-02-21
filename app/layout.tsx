import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366f1",
};

export const metadata: Metadata = {
  title: "Tiket - כרטיסים בקליק",
  description: "פלטפורמת מסחר בכרטיסים לאירועים",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tiket",
  },
  icons: {
    icon: [
      { url: "/images/tiketlogo.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/images/tiketlogo.svg", sizes: "any", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
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
