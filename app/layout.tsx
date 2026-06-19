import type { Metadata, Viewport } from "next";
import { Assistant, Heebo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import NavigationLoader from "./components/NavigationLoader/NavigationLoader";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister/ServiceWorkerRegister";
import NativeDiagnostic from "./components/NativeDiagnostic/NativeDiagnostic";
import { Suspense } from "react";

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
  title: "Tiket - כרטיסים בקליק",
  description: "פלטפורמת מסחר בכרטיסים לאירועים",
  manifest: "/manifest.json",
  appleWebApp: {
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
    <html lang="he" dir="rtl">
      <head></head>
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
