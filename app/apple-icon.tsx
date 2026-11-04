import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1a1916" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <circle cx="31" cy="38" r="11.5" fill="none" stroke="#f3f0ea" strokeWidth="7" />
          <rect x="39" y="11" width="7" height="42.5" rx="3.5" fill="#f3f0ea" />
        </svg>
      </div>
    ),
    size,
  );
}
