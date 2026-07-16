"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, LayoutDashboard, Users, Radio, BookOpen, Info, Moon, Sun, Lock } from "lucide-react";
import { useCompanies } from "@/lib/useCompanies";
import { useTheme } from "@/lib/useTheme";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Overview", desc: "Portfolio dashboard" },
  { href: "/scout", icon: Search, label: "Scout", desc: "ESG due diligence" },
  { href: "/steward", icon: Users, label: "Steward", desc: "Portfolio engagement" },
  { href: "/signal", icon: Radio, label: "Signal", desc: "Megatrend intelligence" },
  { href: "/learn", icon: BookOpen, label: "Learn", desc: "Frameworks & case studies" },
];


export function Navigation() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { companies } = useCompanies();
  const overdueCount = companies
    .filter(c => c.portfolioStatus === "Active")
    .reduce((s, c) => s + c.engagement.filter(e => e.status === "Overdue").length, 0);
  // Detect modifier key on client only to avoid SSR/hydration mismatch
  const [modKey, setModKey] = useState("⌘K");
  useEffect(() => {
    const isWin = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform?.toLowerCase().includes("win") ??
      navigator.platform.toLowerCase().includes("win");
    if (isWin) setModKey("Ctrl+K");
  }, []);

  // Only announce overdue count changes — not the initial value on mount (would spam every navigation)
  const prevOverdueRef = useRef<number | null>(null);
  const [overdueAnnouncement, setOverdueAnnouncement] = useState("");
  useEffect(() => {
    if (prevOverdueRef.current !== null && prevOverdueRef.current !== overdueCount) {
      setOverdueAnnouncement(overdueCount > 0 ? `${overdueCount} overdue engagement${overdueCount !== 1 ? "s" : ""} in portfolio` : "All overdue engagements resolved");
    }
    prevOverdueRef.current = overdueCount;
  }, [overdueCount]);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#F9F8FA] border-r border-gray-200 flex flex-col z-50 text-gray-800">
      {/* sr-only live region — announces overdue count CHANGES to AT, not initial value */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{overdueAnnouncement}</div>
      {/* Brand */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex flex-col gap-1">
          {/* TEMASEK wordmark — serif bold purple, matching the actual logo */}
          <div
            className="font-bold tracking-[0.12em] leading-none text-[#4B2580]"
            style={{
              fontSize: "18px",
              fontFamily: "'Georgia', 'Palatino Linotype', 'Palatino', 'Book Antiqua', 'Times New Roman', serif",
              letterSpacing: "0.15em",
            }}
          >
            TEMASEK
          </div>
          {/* Product name and descriptor */}
          <div className="flex items-center gap-2 mt-1">
            <div className="text-xs font-semibold text-gray-800">Catalyst</div>
            <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">ESG Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1" aria-label="Main navigation">
        {navItems.map(({ href, icon: Icon, label, desc }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                active
                  ? "bg-[#4B2580]/15 border border-[#4B2580]/30"
                  : "hover:bg-gray-200"
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#4B2580]" : "text-gray-500"}`}
              />
              <div>
                <div
                  className={`text-sm font-medium leading-none ${active ? "text-[#4B2580]" : "text-gray-700"}`}
                >
                  {label}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">{desc}</div>
              </div>
              {label === "Steward" && overdueCount > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-orange-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center" aria-label={`${overdueCount} overdue engagement${overdueCount !== 1 ? "s" : ""}`}>
                  <span aria-hidden="true">{overdueCount}</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Link
          href="/about"
          aria-current={pathname === "/about" ? "page" : undefined}
          className={`flex items-center gap-2 text-xs mb-2 transition-colors ${pathname === "/about" ? "text-[#4B2580]" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Info className="w-3 h-3" />
          About this demo
        </Link>
        <Link
          href="/admin"
          aria-current={pathname === "/admin" ? "page" : undefined}
          className={`flex items-center gap-2 text-xs mb-2 transition-colors ${pathname === "/admin" ? "text-[#4B2580]" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Lock className="w-3 h-3" />
          Admin
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-pressed={theme === 'dark'}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors w-full mt-1"
        >
          {theme === 'light' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
          <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
        </button>
        <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-2 px-2">
          <kbd className="bg-gray-100 px-1 rounded font-mono">{modKey}</kbd>
          <span>Search</span>
        </div>
        <div className="text-[10px] text-gray-500 flex items-center gap-1 px-2">
          <kbd className="bg-gray-100 px-1 rounded font-mono text-gray-500">?</kbd>
          <span>Shortcuts</span>
        </div>
        <div className="text-xs text-gray-500 leading-relaxed">
          Temasek ESG Investment Intelligence
        </div>
      </div>
    </aside>
  );
}
