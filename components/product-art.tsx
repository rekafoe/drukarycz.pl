import { useId } from "react";
import type { ProductId } from "@/lib/catalog";

function channels(color: string) {
  const hex = color.replace("#", "").trim();
  if (hex.length < 6) return null;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  if (![r, g, b].every((n) => Number.isFinite(n))) return null;
  return { r, g, b, lum: (r * 299 + g * 587 + b * 114) / 1000 };
}

function outlineFor(color: string) {
  const c = channels(color);
  return c && c.lum > 170 ? "#1a1916" : "#f6f3ee";
}

/** Пример надписи на картинке: коралл, а на красноватой ткани жёлтый, иначе сливается. */
export function sampleInkFor(color: string) {
  const c = channels(color);
  if (c && c.r > c.g * 1.6 && c.r > c.b * 1.6 && c.lum < 150) return "#f2c14e";
  return "#e23b2f";
}

function PrintLines({
  text,
  x,
  y,
  fill,
  fontSize,
  swash,
}: {
  text: string;
  x: number;
  y: number;
  fill: string;
  fontSize: number;
  swash: number;
}) {
  const space = text.indexOf(" ");
  const lines = space > 0 ? [text.slice(0, space), text.slice(space + 1)] : [text];
  const lineHeight = fontSize * 1.12;
  return (
    <g fill={fill} style={{ fontFamily: "var(--font-unbounded), var(--font-manrope), sans-serif" }}>
      {lines.map((line, index) => (
        <text key={line} x={x} y={y + index * lineHeight} textAnchor="middle" fontSize={fontSize} fontWeight={800}>
          {line}
        </text>
      ))}
      <path
        d={`M${x - swash} ${y + lines.length * lineHeight - fontSize * 0.55} q${swash} -${fontSize * 0.35} ${swash * 2} 0`}
        fill="none"
        stroke={fill}
        strokeWidth={fontSize * 0.16}
        strokeLinecap="round"
      />
    </g>
  );
}

const SHIRT_BODY =
  "M92 20 Q120 46 148 20 L186 31 Q206 41 228 74 L204 101 L182 86 L183 228 Q183 236 175 236 L65 236 Q57 236 57 228 L58 86 L36 101 L12 74 Q34 41 54 31 Z";

export function ShirtArt({
  color,
  text,
  size = 280,
  hidePrint = false,
  printColor,
}: {
  color: string;
  text: string;
  size?: number;
  hidePrint?: boolean;
  printColor?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const light = (channels(color)?.lum ?? 0) > 170;
  const ink = printColor ?? sampleInkFor(color);
  return (
    <svg width={size} height={Math.round(size * 1.05)} viewBox="0 0 240 252" aria-hidden>
      <defs>
        <clipPath id={`shirt-${uid}`}>
          <path d={SHIRT_BODY} />
        </clipPath>
        <linearGradient id={`shirt-side-${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.34" />
          <stop offset="0.2" stopColor="#000" stopOpacity="0.06" />
          <stop offset="0.46" stopColor="#fff" stopOpacity={light ? 0.18 : 0.08} />
          <stop offset="0.62" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.84" stopColor="#000" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000" stopOpacity="0.34" />
        </linearGradient>
        <linearGradient id={`shirt-drop-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={light ? 0.12 : 0.05} />
          <stop offset="0.7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
      </defs>
      <path d={SHIRT_BODY} fill={color} stroke="rgba(22,19,15,0.28)" strokeWidth="1.2" />
      <g clipPath={`url(#shirt-${uid})`}>
        <rect x="0" y="0" width="240" height="252" fill={`url(#shirt-side-${uid})`} />
        <rect x="0" y="0" width="240" height="252" fill={`url(#shirt-drop-${uid})`} />
        <path d="M12 74 L36 101 L58 86 Q60 56 54 31 Q34 41 12 74 Z" fill="#000" opacity="0.12" />
        <path d="M228 74 L204 101 L182 86 Q180 56 186 31 Q206 41 228 74 Z" fill="#000" opacity="0.12" />
        <g fill="none" strokeLinecap="round">
          <path d="M62 94 Q84 118 76 156" stroke="#000" strokeOpacity={light ? 0.05 : 0.16} strokeWidth="5" />
          <path d="M178 94 Q156 120 166 158" stroke="#000" strokeOpacity={light ? 0.05 : 0.16} strokeWidth="5" />
          <path d="M98 168 Q90 200 96 234" stroke="#000" strokeOpacity={light ? 0.04 : 0.12} strokeWidth="6" />
          <path d="M150 172 Q158 202 150 234" stroke="#000" strokeOpacity={light ? 0.035 : 0.1} strokeWidth="5" />
          <path d="M104 170 Q97 200 102 232" stroke="#fff" strokeOpacity={light ? 0.5 : 0.07} strokeWidth="2" />
          <path d="M58 86 Q62 58 54 31" stroke="#000" strokeOpacity="0.24" strokeWidth="1.4" />
          <path d="M182 86 Q178 58 186 31" stroke="#000" strokeOpacity="0.24" strokeWidth="1.4" />
          <path d="M18 70 L40 95" stroke="#000" strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="3 3" />
          <path d="M222 70 L200 95" stroke="#000" strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="3 3" />
          <path d="M60 228 L180 228" stroke="#000" strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="3 3" />
        </g>
      </g>
      <path d="M92 20 Q120 46 148 20 Q120 30 92 20 Z" fill="#000" opacity="0.42" />
      <path d="M92 20 Q120 46 148 20" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <path
        d="M92 20 Q120 46 148 20"
        fill="none"
        stroke="#000"
        strokeOpacity="0.22"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M95 24 Q120 44 145 24" fill="none" stroke="#fff" strokeOpacity={light ? 0.5 : 0.12} strokeWidth="1" />
      {hidePrint || !text ? null : <PrintLines text={text} x={120} y={110} fill={ink} fontSize={21} swash={34} />}
    </svg>
  );
}

export function MugArt({
  color,
  text,
  size = 240,
  printColor,
}: {
  color: string;
  text: string;
  size?: number;
  printColor?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const stroke = outlineFor(color);
  const light = stroke === "#1a1916";
  const ink = printColor ?? sampleInkFor(color);
  const body = "M44 46 L44 180 Q44 198 116 198 Q188 198 188 180 L188 46 Z";
  return (
    <svg width={size} height={Math.round(size * 0.92)} viewBox="0 0 240 220" aria-hidden>
      <defs>
        <clipPath id={`mug-${uid}`}>
          <path d={body} />
        </clipPath>
        <linearGradient id={`mug-shade-${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.3" />
          <stop offset="0.16" stopColor="#000" stopOpacity="0.04" />
          <stop offset="0.34" stopColor="#fff" stopOpacity={light ? 0.55 : 0.18} />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.82" stopColor="#000" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000" stopOpacity="0.34" />
        </linearGradient>
      </defs>
      <ellipse cx="122" cy="200" rx="88" ry="10" fill="#16130f" opacity="0.2" />
      <path
        d="M186 76 C238 70 238 162 186 156"
        fill="none"
        stroke="rgba(22,19,15,0.3)"
        strokeWidth="21"
        strokeLinecap="round"
      />
      <path d="M186 76 C238 70 238 162 186 156" fill="none" stroke={color} strokeWidth="18" strokeLinecap="round" />
      <path
        d="M192 84 C226 82 226 150 192 148"
        fill="none"
        stroke="#000"
        strokeOpacity="0.16"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d={body} fill={color} stroke="rgba(22,19,15,0.3)" strokeWidth="1.2" />
      <g clipPath={`url(#mug-${uid})`}>
        <rect x="40" y="30" width="152" height="172" fill={`url(#mug-shade-${uid})`} />
      </g>
      <ellipse cx="116" cy="46" rx="72" ry="13" fill={color} stroke="rgba(22,19,15,0.3)" strokeWidth="1.2" />
      <ellipse cx="116" cy="47.5" rx="63" ry="9" fill="#000" opacity="0.38" />
      <ellipse cx="116" cy="46" rx="72" ry="13" fill="none" stroke="#fff" strokeOpacity={light ? 0.6 : 0.18} strokeWidth="1" />
      {text ? <PrintLines text={text} x={112} y={112} fill={ink} fontSize={20} swash={32} /> : null}
    </svg>
  );
}

export function ProductArt({
  product,
  color,
  text,
  size,
  hidePrint,
  printColor,
}: {
  product: ProductId;
  color: string;
  text: string;
  size?: number;
  hidePrint?: boolean;
  printColor?: string;
}) {
  if (product === "mug") {
    return <MugArt color={color} text={hidePrint ? "" : text} size={size ?? 260} printColor={printColor} />;
  }
  return <ShirtArt color={color} text={text} size={size} hidePrint={hidePrint} printColor={printColor} />;
}

/** Вещь на доске, как на плакате: доска чуть повёрнута, вещь лежит сверху. */
export function ProductStage({
  product,
  color,
  text = "Twój nadruk.",
  board = "board",
  tilt = -5,
  className = "",
}: {
  product: ProductId;
  color: string;
  text?: string;
  board?: "board" | "clay" | "cream";
  tilt?: number;
  className?: string;
}) {
  const boards = { board: "bg-board", clay: "bg-clay", cream: "bg-cream" } as const;
  return (
    <span className={`relative grid aspect-square place-items-center ${className}`}>
      <span
        className={`stage-board absolute inset-x-[3%] inset-y-[8%] rounded-[8%] ${boards[board]}`}
        style={{ transform: `rotate(${tilt}deg)` }}
        aria-hidden
      />
      <span className={`stage-art art-shadow relative block ${product === "mug" ? "w-[82%]" : "w-[90%]"}`}>
        <ProductArt product={product} color={color} text={text} />
      </span>
    </span>
  );
}
