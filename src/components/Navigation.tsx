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

// Temasek brand red — matches their official digital publications
const TEMASEK_RED = "#C41E3A";

function TemasekMark() {
  // Temasek's logo mark: a stylised interlocking T shape
  // The real mark is a rounded-triangle T with distinctive geometry
  // We approximate it with: a bold T formed by trapezoid-like shapes with rounded ends
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Temasek mark">
      {/* Rounded square background */}
      <rect width="36" height="36" rx="7" fill={TEMASEK_RED} />
      {/* Horizontal bar — wider, with rounded caps */}
      <rect x="5" y="9" width="26" height="6" rx="3" fill="white" />
      {/* Vertical stem — narrower, centered, clear gap below bar */}
      <rect x="14" y="15" width="8" height="13" rx="3" fill="white" />
    </svg>
  );
}

export function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0d1526] border-r border-white/5 flex flex-col z-50">
      {/* Brand */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <TemasekMark />
          <div>
            <div className="font-bold text-white text-sm tracking-widest leading-tight">TEMASEK</div>
            <div className="text-[11px] font-semibold leading-tight" style={{ color: TEMASEK_RED }}>Catalyst</div>
            <div className="text-[10px] text-slate-500 leading-tight mt-px">ESG Intelligence</div>
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
                  ? "bg-[#C41E3A]/15 border border-[#C41E3A]/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={active ? { color: TEMASEK_RED } : { color: "rgb(100 116 139)" }}
              />
              <div>
                <div
                  className="text-sm font-medium leading-none"
                  style={active ? { color: TEMASEK_RED } : undefined}
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
          className={`flex items-center gap-2 text-xs mb-2 transition-colors ${
            pathname === "/about" ? "" : "text-slate-600 hover:text-slate-400"
          }`}
          style={pathname === "/about" ? { color: TEMASEK_RED } : undefined}
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
