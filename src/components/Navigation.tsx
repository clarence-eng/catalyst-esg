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

function TemasekMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Temasek mark">
      {/* Background */}
      <rect width="36" height="36" rx="6" fill="#C8102E" />
      {/* Stylised T mark — horizontal bar + vertical stem */}
      <rect x="7" y="9" width="22" height="5" rx="1.5" fill="white" />
      <rect x="15.5" y="9" width="5" height="18" rx="1.5" fill="white" />
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
            <div className="font-bold text-white text-sm tracking-wide">TEMASEK</div>
            <div className="text-xs text-red-400 font-semibold leading-none mt-0.5">Catalyst</div>
            <div className="text-[10px] text-slate-500 mt-0.5 leading-none">ESG Intelligence</div>
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
                  ? "bg-red-600/15 text-red-400 border border-red-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-red-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              <div>
                <div className="text-sm font-medium leading-none">{label}</div>
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
            pathname === "/about" ? "text-red-400" : "text-slate-600 hover:text-slate-400"
          }`}
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
