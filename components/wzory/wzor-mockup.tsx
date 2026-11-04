import { useId } from "react";
import type { ProductId } from "@/lib/catalog";
import type { PrintAreaId } from "@/lib/work";

function isLight(color: string) {
  const hex = color.replace("#", "");
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 170;
}

const shirtBody =
  "M325 40 C352 104 468 104 495 40 L620 74 C680 100 740 150 792 222 L716 300 C700 282 680 262 662 246 " +
  "C664 400 662 600 664 756 Q410 774 156 756 C158 600 156 400 158 246 C140 262 120 282 104 300 L28 222 " +
  "C80 150 140 100 200 74 Z";
const shirtBackBody =
  "M325 40 C360 64 460 64 495 40 L620 74 C680 100 740 150 792 222 L716 300 C700 282 680 262 662 246 " +
  "C664 400 662 600 664 756 Q410 774 156 756 C158 600 156 400 158 246 C140 262 120 282 104 300 L28 222 " +
  "C80 150 140 100 200 74 Z";

/** Мокап в мм: перед футболки ≈ 500 мм, зона 300×400 как в редакторе. */
function ShirtMockup({ color, print, back }: { color: string; print?: string; back: boolean }) {
  const id = useId().replace(/:/g, "");
  const light = isLight(color);
  const zoneY = back ? 110 : 150;
  return (
    <svg viewBox="0 0 820 790" className="h-full w-full" role="img" aria-label={back ? "Tył koszulki" : "Przód koszulki"}>
      <defs>
        <linearGradient id={`${id}-shade`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.22" />
          <stop offset="0.22" stopColor="#000" stopOpacity="0.04" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="0.78" stopColor="#000" stopOpacity="0.04" />
          <stop offset="1" stopColor="#000" stopOpacity="0.24" />
        </linearGradient>
        <clipPath id={`${id}-body`}>
          <path d={back ? shirtBackBody : shirtBody} />
        </clipPath>
      </defs>
      <ellipse cx="410" cy="770" rx="290" ry="14" fill="#000" opacity="0.08" />
      <path d={back ? shirtBackBody : shirtBody} fill={color} stroke={light ? "rgba(26,25,22,0.18)" : "none"} strokeWidth="3" />
      {print ? (
        <image href={print} x="260" y={zoneY} width="300" height="400" preserveAspectRatio="xMidYMid meet" clipPath={`url(#${id}-body)`} />
      ) : null}
      <g clipPath={`url(#${id}-body)`}>
        <rect x="0" y="0" width="820" height="790" fill={`url(#${id}-shade)`} />
        <path d="M200 74 C214 140 160 220 158 246" stroke="#000" strokeOpacity="0.08" strokeWidth="3" fill="none" />
        <path d="M620 74 C606 140 660 220 662 246" stroke="#000" strokeOpacity="0.08" strokeWidth="3" fill="none" />
      </g>
      <path
        d={back ? "M325 40 C360 64 460 64 495 40" : "M325 40 C352 104 468 104 495 40"}
        fill="none"
        stroke={light ? "rgba(26,25,22,0.16)" : "rgba(255,255,255,0.12)"}
        strokeWidth="14"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Кружка спереди показывает середину обхвата, под ней — весь развёрнутый принт 200×85. */
function MugMockup({ color, print }: { color: string; print?: string }) {
  const id = useId().replace(/:/g, "");
  const light = isLight(color);
  const stroke = light ? "rgba(26,25,22,0.22)" : "rgba(255,255,255,0.08)";
  return (
    <svg viewBox="0 0 320 400" className="h-full w-full" role="img" aria-label="Kubek z nadrukiem dookoła">
      <defs>
        <linearGradient id={`${id}-cyl`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.32" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.34" />
        </linearGradient>
        <clipPath id={`${id}-mug`}>
          <path d="M60 40 H240 V236 C240 252 228 262 212 262 H88 C72 262 60 252 60 236 Z" />
        </clipPath>
      </defs>
      <ellipse cx="150" cy="268" rx="104" ry="8" fill="#000" opacity="0.08" />
      <path
        d="M240 88 C298 86 300 214 240 212 V190 C274 192 274 110 240 112 Z"
        fill={color}
        stroke={stroke}
        strokeWidth="2"
      />
      <path d="M60 40 H240 V236 C240 252 228 262 212 262 H88 C72 262 60 252 60 236 Z" fill={color} stroke={stroke} strokeWidth="2" />
      {print ? (
        <svg x="60" y="65" width="180" height="170" viewBox="40 0 120 85" preserveAspectRatio="none" clipPath={`url(#${id}-mug)`}>
          <image href={print} x="0" y="0" width="200" height="85" preserveAspectRatio="none" />
        </svg>
      ) : null}
      <rect x="60" y="40" width="180" height="222" fill={`url(#${id}-cyl)`} clipPath={`url(#${id}-mug)`} />
      <ellipse cx="150" cy="40" rx="90" ry="10" fill={color} stroke={stroke} strokeWidth="2" />
      <ellipse cx="150" cy="41" rx="82" ry="7" fill="#000" opacity="0.18" />
      <rect x="30" y="284" width="260" height="110.5" rx="10" fill={color} stroke={stroke} strokeWidth="2" />
      {print ? <image href={print} x="30" y="284" width="260" height="110.5" preserveAspectRatio="none" /> : null}
    </svg>
  );
}

export function WzorMockup({
  product,
  color,
  previews,
  image,
  view,
}: {
  product: ProductId;
  color: string;
  previews: Partial<Record<PrintAreaId, string>>;
  image?: string | null;
  view?: PrintAreaId;
}) {
  if (product === "mug") {
    if (!previews.wrap && image) return <PlainImage src={image} />;
    return <MugMockup color={color} print={previews.wrap} />;
  }
  const side = view === "back" || (!view && !previews.front && previews.back) ? "back" : "front";
  if (!previews.front && !previews.back && image) return <PlainImage src={image} />;
  return <ShirtMockup color={color} print={previews[side]} back={side === "back"} />;
}

function PlainImage({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-full w-full object-contain" />;
}
