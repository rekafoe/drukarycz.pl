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

export function MugArt({ text, size = 240 }: { text: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <rect x="48" y="48" width="90" height="110" rx="12" fill="#f7f4ef" stroke="#1a1916" strokeWidth="3" />
      <path d="M138 78h16a24 24 0 0 1 0 48h-16" fill="none" stroke="#1a1916" strokeWidth="3" />
      <text
        x="93"
        y="112"
        textAnchor="middle"
        fontFamily="Manrope, sans-serif"
        fontSize="14"
        fontWeight="800"
        fill="#1a1916"
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
  if (product === "mug") return <MugArt text={hidePrint ? "" : text} size={size ?? 260} />;
  return <ShirtArt color={color} text={text} size={size} hidePrint={hidePrint} />;
}
