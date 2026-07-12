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
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#F5F5F7" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "40px", maxWidth: "400px", width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <div aria-hidden="true" style={{ fontSize: "40px", color: "#fca5a5", marginBottom: "16px" }}>⚠</div>
            <h1 style={{ fontSize: "18px", fontWeight: "600", color: "#111827", marginBottom: "8px" }}>Something went wrong</h1>
            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>
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
                style={{ fontSize: "14px", color: "#374151", border: "1px solid #e5e7eb", padding: "10px 20px", borderRadius: "8px", textDecoration: "none" }}
              >
                Back to Overview
              </a>
            </div>
            {error.digest && (
              <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "16px" }}>Error ID: {error.digest}</p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
