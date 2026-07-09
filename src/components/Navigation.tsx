"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, LayoutDashboard, Users, Radio, BookOpen, Info } from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Overview", desc: "Portfolio dashboard" },
  { href: "/scout", icon: Search, label: "Scout", desc: "ESG due diligence" },
  { href: "/steward", icon: Users, label: "Steward", desc: "Portfolio engagement" },
  { href: "/signal", icon: Radio, label: "Signal", desc: "Megatrend intelligence" },
  { href: "/learn", icon: BookOpen, label: "Learn", desc: "Frameworks & case studies" },
];

// Temasek brand color — deep purple from the official TEMASEK wordmark logo
const TEMASEK_PURPLE = "#4B2580";
const TEMASEK_PURPLE_ACTIVE = "#B39DDB";

export function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0d1526] border-r border-white/5 flex flex-col z-50">
      {/* Brand */}
      <div className="p-5 border-b border-white/5">
        <div className="flex flex-col gap-1">
          {/* TEMASEK wordmark — serif bold purple, matching the actual logo */}
          <div
            className="font-bold tracking-[0.12em] leading-none"
            style={{
              color: TEMASEK_PURPLE,
              fontSize: "18px",
              fontFamily: "'Georgia', 'Palatino Linotype', 'Palatino', 'Book Antiqua', 'Times New Roman', serif",
              letterSpacing: "0.15em",
            }}
          >
            TEMASEK
          </div>
          {/* Product name and descriptor */}
          <div className="flex items-center gap-2 mt-1">
            <div className="text-xs font-semibold text-white">Catalyst</div>
            <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">ESG Intelligence</div>
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
                  ? "bg-[#4B2580]/20 border border-[#4B2580]/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={
                  active
                    ? { color: TEMASEK_PURPLE_ACTIVE }
                    : { color: "rgb(100 116 139)" }
                }
              />
              <div>
                <div
                  className="text-sm font-medium leading-none"
                  style={
                    active
                      ? { color: TEMASEK_PURPLE_ACTIVE }
                      : { color: "rgb(148 163 184)" }
                  }
                >
                  {label}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{desc}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <Link
          href="/about"
          aria-current={pathname === "/about" ? "page" : undefined}
          className="flex items-center gap-2 text-xs mb-2 transition-colors text-slate-600 hover:text-slate-400"
          style={pathname === "/about" ? { color: TEMASEK_PURPLE_ACTIVE } : undefined}
        >
          <Info className="w-3 h-3" />
          About this demo
        </Link>
        <div className="text-xs text-slate-600 leading-relaxed">
          Temasek ESG Investment Intelligence
        </div>
      </div>
    </aside>
  );
}
