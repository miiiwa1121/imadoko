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

const siteUrl = "https://imadoko.link";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "imadoko | リアルタイム位置情報共有で待ち合わせをもっと簡単に",
  description:
    "アプリ不要・登録不要で使えるリアルタイム位置情報共有サービス。待ち合わせや家族・友人との合流を、リンク共有だけでスムーズに。",
  keywords: [
    "位置情報",
    "共有",
    "リアルタイム",
    "待ち合わせ",
    "アプリ不要",
    "imadoko",
  ],
  verification: {
    google: 'content="YldVdgamsIS0CRmYIZSa9bJ4FTQaxCMXTNurmb5M4Vg" ',
  },
  openGraph: {
    title: "imadoko | リアルタイム位置情報共有で待ち合わせをもっと簡単に",
    description:
      "アプリ不要・登録不要で使えるリアルタイム位置情報共有サービス。待ち合わせや家族・友人との合流を、リンク共有だけでスムーズに。",
    url: siteUrl,
    siteName: "imadoko",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "imadoko",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "imadoko | リアルタイム位置情報共有で待ち合わせをもっと簡単に",
    description:
      "アプリ不要・登録不要で使えるリアルタイム位置情報共有サービス。待ち合わせや家族・友人との合流を、リンク共有だけでスムーズに。",
    images: ["/icon.png"],
  },
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
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
