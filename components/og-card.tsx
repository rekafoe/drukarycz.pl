import { ImageResponse } from "next/og";
import type { ProductId } from "@/lib/catalog";
import { seller } from "@/lib/seller";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/** Встроенный шрифт next/og знает только латиницу. На другой глиф он сам пошёл бы на fonts.googleapis.com. */
function ascii(text: string) {
  if (!/^[\x20-\x7e]*$/.test(text)) throw new Error(`Tekst OG tylko ASCII: ${text}`);
  return text;
}

const ink = "#16130F";
const paper = "#F3EEE4";
const muted = "#6b6358";
const kobalt = "#2F5BFF";

function Shirt({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={Math.round(size * 1.05)} viewBox="0 0 200 210">
      <path fill={color} d="M70 28c8 14 52 14 60 0l28 14-18 28-14-8v120H74V62l-14 8L42 42l28-14z" />
    </svg>
  );
}

function Mug({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <rect x="48" y="48" width="90" height="110" rx="12" fill={color} />
      <path d="M138 78h16a24 24 0 0 1 0 48h-16" fill="none" stroke={color} strokeWidth="9" />
    </svg>
  );
}

export function ogCard({ title, line, product }: { title: string; line: string; product?: ProductId }) {
  const price = ascii(`od ${seller.priceFromPln} PLN`);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: paper, color: ink }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 680,
            padding: "64px 0 64px 72px",
          }}
        >
          <div style={{ fontSize: 40, letterSpacing: -1 }}>{ascii(seller.brand)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ fontSize: 76, lineHeight: 1.02, letterSpacing: -2 }}>{ascii(title)}</div>
            <div style={{ fontSize: 28, color: muted }}>{ascii(line)}</div>
          </div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: kobalt,
              color: paper,
              borderRadius: 999,
              padding: "14px 30px",
              fontSize: 34,
            }}
          >
            {price}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            margin: 32,
            borderRadius: 32,
            background: "#171614",
          }}
        >
          {product !== "mug" ? <Shirt size={product ? 380 : 260} color={paper} /> : null}
          {product !== "tshirt" ? <Mug size={product ? 360 : 220} color={paper} /> : null}
        </div>
      </div>
    ),
    ogSize,
  );
}
