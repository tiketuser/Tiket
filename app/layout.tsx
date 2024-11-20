import type { Metadata } from "next";
import localFont from "next/font/local";
import { Assistant } from 'next/font/google';
import "./globals.css";

const assistant = Assistant({
  weight: ['400', '700'],
  style: ['normal'],
  subsets: ['hebrew'],
  display: 'swap',
  variable: "--font-assistant",
})

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
      <body
        className={`${assistant.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
