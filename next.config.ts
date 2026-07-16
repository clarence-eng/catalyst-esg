import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Belt-and-suspenders: keep X-Frame-Options for legacy proxies/enterprise appliances
  // that honour it but don't understand CSP frame-ancestors (RFC 7034)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // HSTS: instructs browsers to always use HTTPS for 1 year, preventing TLS-downgrade
  // cookie theft on initial HTTP requests before server redirect fires.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    // CSP notes:
    // - 'unsafe-inline' in script-src is required for the FOUC-prevention inline script in
    //   layout.tsx and global-error.tsx. The correct long-term fix is a per-request nonce
    //   threaded from middleware into both these headers and the <script> tags. Left as a
    //   known limitation — the FOUC script is static and cannot execute arbitrary injected JS.
    // - connect-src: Gemini API calls are server-side (route handler), not browser fetches,
    //   so generativelanguage.googleapis.com does not need to be listed here.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
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
