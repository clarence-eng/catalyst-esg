import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f1117",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "64px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(ellipse at top left, #2d1b4e 0%, #0f1117 60%)",
          }}
        />
        {/* TEMASEK wordmark */}
        <div
          style={{
            position: "absolute",
            top: "64px",
            left: "64px",
            color: "#a78bfa",
            fontSize: "18px",
            fontFamily: "Georgia, serif",
            letterSpacing: "0.15em",
            fontWeight: "bold",
          }}
        >
          TEMASEK
        </div>
        {/* Main title */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ color: "#f1f5f9", fontSize: "56px", fontWeight: "bold", lineHeight: 1.1, fontFamily: "sans-serif" }}>
            Catalyst
          </div>
          <div style={{ color: "#94a3b8", fontSize: "28px", fontFamily: "sans-serif", fontWeight: "normal" }}>
            ESG Investment Intelligence
          </div>
          <div style={{ color: "#64748b", fontSize: "18px", fontFamily: "sans-serif", marginTop: "8px" }}>
            ESG due diligence · Portfolio stewardship · Climate risk · Megatrend intelligence
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
