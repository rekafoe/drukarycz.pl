import { seller } from "@/lib/seller";

export function BrandMark({ className = "" }: { className?: string }) {
  const dot = seller.brand.lastIndexOf(".");
  const name = dot > 0 ? seller.brand.slice(0, dot) : seller.brand;
  const tail = dot > 0 ? seller.brand.slice(dot) : "";
  return (
    <span className={`font-display font-extrabold tracking-[-0.02em] ${className}`}>
      {name}
      <span className="text-coral">{tail}</span>
    </span>
  );
}

export function PriceChip({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = {
    sm: "rounded-md px-2 py-0.5 text-[13px]",
    md: "rounded-lg px-3 py-1.5 text-base",
    lg: "rounded-xl px-4 py-2 text-[26px] md:text-[30px]",
  } as const;
  return (
    <span
      className={`inline-flex w-fit items-center bg-sun font-display font-extrabold whitespace-nowrap text-poster ${sizes[size]} ${className}`}
    >
      {seller.priceFrom}
    </span>
  );
}

export function ArrowIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BagIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M4.5 7h11l-.8 9.2a1 1 0 0 1-1 .8H6.3a1 1 0 0 1-1-.8L4.5 7Zm2.8 0V5.8a2.7 2.7 0 0 1 5.4 0V7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const coralButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-coral font-bold text-white transition-colors hover:bg-coral-deep disabled:opacity-60";

export const inkButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-poster font-bold text-cream transition-colors hover:bg-[#2b2620] disabled:opacity-60";

export const fieldInput =
  "rounded-xl border border-line bg-white px-3.5 py-3 font-medium text-poster placeholder:text-muted focus:border-poster focus:outline-none";
