import type { ReactNode, SVGProps } from "react";
import { productById, shirtColors, sizes, type ProductId } from "@/lib/catalog";
import type { WorkSnapshot } from "@/lib/work";
import type { AccentId } from "./accents";

export type Variant = "a" | "b" | "c";

export const variantNames: Record<Variant, string> = {
  a: "Plakat",
  b: "Siatka",
  c: "Ceramika",
};

export function parseVariant(value: unknown): Variant | null {
  return value === "a" || value === "b" || value === "c" ? value : null;
}

export type DoorsViewProps = {
  leaving: ProductId | null;
  onPick: (id: ProductId) => void;
  onCart: () => void;
  account: ReactNode;
  accent?: AccentId;
};

export type ShopPatch = Partial<Pick<WorkSnapshot, "size" | "color" | "qty">>;

export type ShopViewProps = {
  work: WorkSnapshot;
  onChange: (patch: ShopPatch) => void;
  onProduct: (id: ProductId) => void;
  onHome: () => void;
  onCart: () => void;
  onEditor: () => void;
  account: ReactNode;
  accent?: AccentId;
  chosen?: ReactNode;
  showcase?: ReactNode;
};

type ProductImage = { src: string; width: number; height: number };

const imageSize: Record<ProductId, { width: number; height: number }> = {
  tshirt: { width: 1117, height: 1200 },
  mug: { width: 1130, height: 1129 },
};

const colorIds: Record<string, string> = Object.fromEntries(shirtColors.map((swatch) => [swatch.value, swatch.id]));

/** Рендеры моделей редактора: тот же крой и та же кружка, что на 3D. */
export function productImage(product: ProductId, color: string): ProductImage {
  const id = colorIds[color] ?? "black";
  return { src: `/products/${product === "mug" ? "mug" : "tee"}-${id}.webp`, ...imageSize[product] };
}

export function sampleImage(product: ProductId, print: "poster" | "grid" | "leaf"): ProductImage {
  const name = product === "mug" ? `mug-sand-${print}` : `tee-black-${print}`;
  return { src: `/products/${name}.webp`, ...imageSize[product] };
}

/** Где на рендере футболки лежит зона «Przód» 300×400 мм, в долях кадра. */
export const teeFrontZone = { left: 28.8, top: 22.4, width: 40.7, height: 50.8 };

export function shopModel(work: WorkSnapshot) {
  const product = productById(work.product);
  const color = shirtColors.find((swatch) => swatch.value === work.color) ?? shirtColors[0];
  const isShirt = work.product === "tshirt";
  return {
    product,
    color,
    isShirt,
    sizes,
    colors: shirtColors,
    zonesLine: product.zones.map((zone) => `${zone.label} ${zone.widthMm}×${zone.heightMm} mm`).join(" · "),
    summary: [isShirt ? work.size : "330 ml", color.label, `${work.qty} szt.`].join(" · "),
  };
}

export function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function BagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

export function CubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M4 7.5 12 12l8-4.5M12 12v9" />
    </svg>
  );
}

export function SheetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v4h4M9 13h6M9 17h4" />
    </svg>
  );
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}