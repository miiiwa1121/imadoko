import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import 'leaflet/dist/leaflet.css';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Imadoko Share | リアルタイム位置情報共有",
  description: "アプリ不要で使える、一時的な位置情報共有サービスです。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // ズーム禁止の要
  interactiveWidget: "resizes-visual", // キーボード表示時のUI崩れ対策
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
