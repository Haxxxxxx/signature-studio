import { ImageResponse } from "next/og";

export const alt = "Signature Studio — Free Gmail email signature generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Og() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            ✉️
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, opacity: 0.95 }}>Signature Studio</div>
        </div>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
          Email signatures that look good in Gmail.
        </div>
        <div style={{ fontSize: 30, opacity: 0.9, marginTop: 28, maxWidth: 880 }}>
          Templates · social icons · UTM tracking · vCard QR — copy-paste or push
          straight to Gmail.
        </div>
      </div>
    ),
    { ...size }
  );
}
