import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { GlobalSearch } from "@/components/GlobalSearch";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Catalyst by Temasek — ESG Investment Intelligence",
  description:
    "Temasek ESG Investment Intelligence platform — ESG due diligence, portfolio engagement, climate risk, and megatrend analysis for institutional investors.",
  openGraph: {
    title: "Catalyst by Temasek — ESG Investment Intelligence",
    description: "ESG due diligence, portfolio engagement, climate risk, and megatrend analysis for institutional investors.",
    siteName: "Catalyst by Temasek",
    locale: "en_SG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Catalyst by Temasek — ESG Investment Intelligence",
    description: "ESG due diligence, portfolio engagement, climate risk, and megatrend analysis.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Inline script runs before first paint to prevent dark-mode FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('catalyst-theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s===null&&p))document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-[#F5F5F7] text-gray-800 min-h-screen">
        {/* Skip-to-content link — WCAG 2.4.1 bypass blocks */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#4B2580] focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <Navigation />
        <GlobalSearch />
        <KeyboardShortcuts />
        <main id="main-content" tabIndex={-1} className="ml-64 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
