import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeModeScript } from "flowbite-react";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Canonical site origin (build-time env). metadataBase lets per-page relative OG
// image paths (e.g. /og-default.png, or a post cover) resolve to absolute URLs that
// social scrapers require. Defaults to the production Firebase Hosting URL.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://personal-website-490704.web.app";
const siteName = "Bayu Wicaksono";
const siteDescription = "Personal Website of Bayu Wicaksono";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteName,
  description: siteDescription,
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description: siteDescription,
    url: "/",
    images: ["/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/og-default.png"],
  },
};

// Bare document shell shared by every route. Public marketing chrome lives in the
// (public) route group; the admin area supplies its own shell. Keeping the body as a
// min-height flex column lets both groups size their own full-height layouts.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ThemeModeScript />
        <link rel="icon" href="/sleepy.png" />
      </head>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
