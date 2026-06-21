import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeModeScript } from "flowbite-react";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bayu Wicaksono",
  description: "Personal Website of Bayu Wicaksono",
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
