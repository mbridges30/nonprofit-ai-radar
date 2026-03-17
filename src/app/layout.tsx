import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "Nonprofit AI Radar | Bridges Strategy",
    template: "%s | Bridges Strategy",
  },
  description:
    "Discover, track, and evaluate AI applications for the nonprofit sector. A living repository of use cases, daily news, and readiness insights.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://radar.bridgesstrategy.com"
  ),
  openGraph: {
    type: "website",
    siteName: "Nonprofit AI Radar",
    title: "Nonprofit AI Radar | Bridges Strategy",
    description:
      "Discover, track, and evaluate AI applications for the nonprofit sector.",
  },
  twitter: {
    card: "summary",
  },
  robots: {
    index: true,
    follow: true,
  },
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
