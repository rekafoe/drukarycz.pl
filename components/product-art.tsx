import type { ProductId } from "@/lib/catalog";

export function ShirtArt({
  color,
  text,
  size = 280,
  hidePrint = false,
}: {
  color: string;
  text: string;
  size?: number;
  hidePrint?: boolean;
}) {
  const ink = color === "#f4f1ea" ? "#171614" : "#f6f3ee";
  return (
    <svg width={size} height={Math.round(size * 1.05)} viewBox="0 0 200 210" aria-hidden>
      <path fill={color} d="M70 28c8 14 52 14 60 0l28 14-18 28-14-8v120H74V62l-14 8L42 42l28-14z" />
      {hidePrint ? null : (
        <text
          x="100"
          y="118"
          textAnchor="middle"
          fontFamily="Manrope, sans-serif"
          fontSize="16"
          fontWeight="800"
          fill={ink}
        >
          {text}
        </text>
      )}
    </svg>
  );
}

function outlineFor(color: string) {
  const hex = color.replace("#", "");
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const lum = (r * 299 + g * 587 + b * 114) / 1000;
  return lum > 170 ? "#1a1916" : "#f6f3ee";
}

export function MugArt({ color, text, size = 240 }: { color: string; text: string; size?: number }) {
  const stroke = outlineFor(color);
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <rect x="48" y="48" width="90" height="110" rx="12" fill={color} stroke={stroke} strokeWidth="3" />
      <path d="M138 78h16a24 24 0 0 1 0 48h-16" fill="none" stroke={stroke} strokeWidth="3" />
      <text
        x="93"
        y="112"
        textAnchor="middle"
        fontFamily="Manrope, sans-serif"
        fontSize="14"
        fontWeight="800"
        fill={stroke}
      >
        {text}
      </text>
    </svg>
  );
}

export function ProductArt({
  product,
  color,
  text,
  size,
  hidePrint,
}: {
  product: ProductId;
  color: string;
  text: string;
  size?: number;
  hidePrint?: boolean;
}) {
  if (product === "mug") return <MugArt color={color} text={hidePrint ? "" : text} size={size ?? 260} />;
  return <ShirtArt color={color} text={text} size={size} hidePrint={hidePrint} />;
}
