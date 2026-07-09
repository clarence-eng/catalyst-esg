"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, LayoutDashboard, Users, Radio, Leaf, BookOpen, Info } from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Overview", desc: "Portfolio dashboard" },
  { href: "/scout", icon: Search, label: "Scout", desc: "ESG due diligence" },
  { href: "/steward", icon: Users, label: "Steward", desc: "Portfolio engagement" },
  { href: "/signal", icon: Radio, label: "Signal", desc: "Megatrend intelligence" },
  { href: "/learn", icon: BookOpen, label: "Learn", desc: "Frameworks & case studies" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0d1526] border-r border-white/5 flex flex-col z-50">
      {/* Brand */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">Catalyst</div>
            <div className="text-xs text-slate-500">ESG Intelligence</div>
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
                  ? "bg-emerald-600/15 text-emerald-400 border border-emerald-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`} />
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
            pathname === "/about" ? "text-emerald-400" : "text-slate-600 hover:text-slate-400"
          }`}
        >
          <Info className="w-3 h-3" />
          About this demo
        </Link>
        <div className="text-xs text-slate-600 leading-relaxed">
          Candidate portfolio demo
        </div>
      </div>
    </aside>
  );
}
