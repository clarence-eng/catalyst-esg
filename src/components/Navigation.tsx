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

// Temasek brand red — from their official publications and annual reviews
const TEMASEK_RED = "#BA0C2F";

function TemasekMark() {
  // Temasek's actual logo mark: three overlapping teardrop/leaf shapes arranged
  // in rotational symmetry (120° apart) forming a stylised three-pointed mark.
  // The three petals overlap at the centre, each petal pointing outward.
  // Rendered as an SVG mark in the Temasek brand red.
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Temasek logo mark"
    >
      {/* Three-petal Temasek mark — each petal is a rotated teardrop shape */}
      {/* Centre point: (50, 50). Each petal is 120° apart. */}

      {/* Petal 1 — pointing up */}
      <path
        d="M50 50 C50 50 35 40 33 22 C31 8 42 3 50 10 C58 3 69 8 67 22 C65 40 50 50 50 50Z"
        fill={TEMASEK_RED}
      />
      {/* Petal 2 — pointing lower-right (120° rotation) */}
      <path
        d="M50 50 C50 50 62 38 79 41 C93 43 94 55 88 61 C82 67 71 63 65 54 C58 44 50 50 50 50Z"
        fill={TEMASEK_RED}
      />
      {/* Petal 3 — pointing lower-left (240° rotation) */}
      <path
        d="M50 50 C50 50 38 38 21 41 C7 43 6 55 12 61 C18 67 29 63 35 54 C42 44 50 50 50 50Z"
        fill={TEMASEK_RED}
      />
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
            <div
              className="font-bold text-sm tracking-widest leading-tight"
              style={{ color: TEMASEK_RED }}
            >
              TEMASEK
            </div>
            <div className="text-xs text-white font-semibold leading-tight mt-0.5">Catalyst</div>
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
                  ? "border border-white/10 bg-white/5"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={
                  active
                    ? { color: TEMASEK_RED }
                    : { color: "rgb(100 116 139)" }
                }
              />
              <div>
                <div
                  className="text-sm font-medium leading-none"
                  style={active ? { color: TEMASEK_RED } : { color: "rgb(148 163 184)" }}
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
          className="flex items-center gap-2 text-xs mb-2 transition-colors text-slate-600 hover:text-slate-400"
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
