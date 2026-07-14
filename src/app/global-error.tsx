"use client";
import { useEffect } from "react";

// Catches errors thrown in the root layout (Navigation, GlobalSearch, etc.)
// Must be named global-error.tsx and must include <html>/<body> wrapper
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Catalyst] Root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      {/* Apply saved dark mode preference since layout.tsx FOUC script doesn't run here */}
      <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('theme')==='dark'||(!localStorage.getItem('theme')&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();` }} />
      <body className="bg-[#F5F5F7] dark:bg-[#0a0f1e]" style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div className="bg-white dark:bg-[#141824] border border-gray-200 dark:border-gray-700" style={{ borderRadius: "16px", padding: "40px", maxWidth: "400px", width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <div aria-hidden="true" style={{ fontSize: "40px", color: "#fca5a5", marginBottom: "16px" }}>⚠</div>
            <h1 className="text-gray-900 dark:text-gray-100" style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>Something went wrong</h1>
            <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: "14px", marginBottom: "24px" }}>
              An unexpected error occurred in the application shell.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={reset}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = "#3D1A6E"; }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = "#4B2580"; }}
                style={{ background: "#4B2580", color: "white", fontSize: "14px", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer" }}
              >
                Try again
              </button>
              <a
                href="/"
                className="text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                style={{ fontSize: "14px", padding: "10px 20px", borderRadius: "8px", textDecoration: "none" }}
              >
                Back to Overview
              </a>
            </div>
            {error.digest && (
              <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: "11px", marginTop: "16px" }}>Error ID: {error.digest}</p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
