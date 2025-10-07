import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeModeScript } from "flowbite-react";
import { CustomNavbar } from "@/components/CustomNavbar";
import CustomFooter from "@/components/CustomFooter";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bayu Wicaksono",
  description: "Personal Website of Bayu Wicaksono",
};

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
        {/* Navbar */}
        <CustomNavbar />
        {/* Main Content */}
        {children}
        {/* Footer */}
        <CustomFooter />
      </body>
    </html>
  );
}
