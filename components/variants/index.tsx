"use client";

import "./variants.css";
import { CeramicDoors, CeramicShop } from "./ceramic";
import { GridDoors, GridShop } from "./grid";
import { variantNames, type DoorsViewProps, type ShopViewProps, type Variant } from "./kit";
import { PosterDoors, PosterShop } from "./poster";

export function VariantDoors({ variant, ...props }: DoorsViewProps & { variant: Variant }) {
  if (variant === "b") return <GridDoors {...props} />;
  if (variant === "c") return <CeramicDoors {...props} />;
  return <PosterDoors {...props} />;
}

export function VariantShop({ variant, ...props }: ShopViewProps & { variant: Variant }) {
  if (variant === "b") return <GridShop {...props} />;
  if (variant === "c") return <CeramicShop {...props} />;
  return <PosterShop {...props} />;
}

/** Переключатель только для согласования: виден, пока в адресе есть ?v=. */
export function VariantSwitch({ variant }: { variant: Variant }) {
  return (
    <nav
      aria-label="Warianty wyglądu"
      data-variant-switch
      className="font-ui fixed bottom-24 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#141414]/90 p-1 text-[12px] text-white shadow-lg backdrop-blur md:top-3.5 md:bottom-auto"
    >
      <span className="px-2.5 font-semibold text-white/60">Wariant</span>
      {(Object.keys(variantNames) as Variant[]).map((id) => (
        <a
          key={id}
          href={`/?v=${id}`}
          aria-current={id === variant ? "page" : undefined}
          className={`rounded-full px-3 py-1.5 font-bold ${id === variant ? "bg-white text-[#141414]" : "hover:bg-white/15"}`}
        >
          {id.toUpperCase()} {variantNames[id]}
        </a>
      ))}
    </nav>
  );
}
