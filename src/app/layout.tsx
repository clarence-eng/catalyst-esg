import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Catalyst — ESG Investment Intelligence",
  description:
    "ESG due diligence, portfolio engagement, and megatrend intelligence for institutional investors.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0a0f1e] text-slate-100 min-h-screen">
        <Navigation />
        <main className="ml-64 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
