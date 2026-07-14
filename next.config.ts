import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Note: X-Frame-Options removed — frame-ancestors 'none' in CSP supersedes it per RFC 7034
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    // CSP: allows self, inline scripts (needed for FOUC prevention script in layout.tsx),
    // Google Fonts, Supabase, and the Vercel deployment itself.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
