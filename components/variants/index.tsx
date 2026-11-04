"use client";

import "./variants.css";
import { accents, type AccentId } from "./accents";
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

/** Подбор акцента плаката: виден, пока в адресе есть ?accent=. */
export function AccentPanel({ accent, raised, lowered }: { accent: AccentId; raised: boolean; lowered: boolean }) {
  return (
    <nav
      aria-label="Kolor akcentu"
      data-accent-panel
      className={`font-ui fixed left-1/2 z-[70] flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-full bg-[#141414]/90 p-1 text-[12px] text-white shadow-lg backdrop-blur md:bottom-auto ${
        raised ? "bottom-24" : "bottom-3"
      } ${lowered ? "md:top-16" : "md:top-3.5"}`}
    >
      <span className="hidden px-2.5 font-semibold text-white/60 sm:inline">Akcent</span>
      {accents.map((item) => {
        const active = item.id === accent;
        return (
          <a
            key={item.id}
            href={`/?accent=${item.id}`}
            aria-current={active ? "page" : undefined}
            title={item.name}
            className={`flex shrink-0 items-center gap-1.5 rounded-full p-1 font-bold md:pr-2.5 ${
              active ? "bg-white text-[#141414]" : "hover:bg-white/15"
            }`}
          >
            <span
              aria-hidden
              className="h-6 w-6 rounded-full ring-1 ring-white/30 md:h-5 md:w-5"
              style={{ background: `linear-gradient(135deg, ${item.cta} 0 50%, ${item.badge} 50% 100%)` }}
            />
            <span className="hidden md:inline">{item.name}</span>
          </a>
        );
      })}
    </nav>
  );
}
