import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import "./globals.css";
import NavigationLoader from "./components/NavigationLoader/NavigationLoader";
import { Suspense } from "react";

const assistant = Assistant({
  weight: ["400", "700"],
  style: ["normal"],
  subsets: ["hebrew"],
  display: "swap",
  variable: "--font-assistant",
});

export const metadata: Metadata = {
  title: "Tiket",
  description: "Tiket",
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
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
