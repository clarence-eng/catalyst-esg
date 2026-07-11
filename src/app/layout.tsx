import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { GlobalSearch } from "@/components/GlobalSearch";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Catalyst by Temasek — ESG Investment Intelligence",
  description:
    "Temasek ESG Investment Intelligence platform — ESG due diligence, portfolio engagement, climate risk, and megatrend analysis for institutional investors.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#F5F5F7] text-gray-800 min-h-screen">
        <Navigation />
        <GlobalSearch />
        <main className="ml-64 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
