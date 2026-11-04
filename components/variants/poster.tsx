"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ProductId } from "@/lib/catalog";
import { SiteFooter } from "@/components/site-footer";
import { seller } from "@/lib/seller";
import {
  ArrowIcon,
  BagIcon,
  productImage,
  sampleImage,
  shopModel,
  type DoorsViewProps,
  type ShopViewProps,
} from "./kit";

const [brandName, brandTld] = seller.brand.split(".");

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-poster text-[17px] font-extrabold md:text-[20px] ${className}`}>
      {brandName}
      <span className="text-[#E23B2F]">.</span>
      {brandTld}
    </span>
  );
}

function PriceChip({ big = false }: { big?: boolean }) {
  return (
    <span
      className={`font-poster inline-flex shrink-0 items-center rounded-full bg-[#F2C14E] font-bold text-[#16130F] ${
        big ? "px-5 py-2.5 text-[22px]" : "px-4 py-2 text-[15px]"
      }`}
    >
      {seller.priceFrom}
    </span>
  );
}

function CartButton({ onCart }: { onCart: () => void }) {
  return (
    <button
      type="button"
      onClick={onCart}
      className="inline-flex items-center gap-2 rounded-full bg-[#F3EEE4] px-3.5 py-2 text-sm font-bold text-[#16130F] ring-1 ring-black/10 hover:bg-white"
    >
      <BagIcon width={18} height={18} />
      <span className="hidden sm:inline">Koszyk</span>
    </button>
  );
}

export function PosterDoors({ leaving, onPick, onCart, account }: DoorsViewProps) {
  return (
    <section className="font-ui doors relative flex min-h-svh flex-col overflow-hidden bg-[#16130F] md:h-svh md:min-h-[600px] md:flex-row">
      <h1 className="sr-only">Twój nadruk na koszulce i kubku — {seller.brand}</h1>
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-5 py-3 md:px-8 md:py-5">
        <Wordmark className="text-[#F3EEE4]" />
        <div className="flex items-center gap-2">
          <CartButton onCart={onCart} />
          {account}
        </div>
      </header>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[58px] z-20 px-5 text-[#F3EEE4] mix-blend-difference md:top-[max(80px,11vh)] md:text-center"
      >
        <p className="poster-headline font-poster text-[32px] leading-[0.95] font-black md:text-[length:clamp(60px,min(8.4vw,13.5vh),150px)]">
          <span>Twój</span> <span>nadruk.</span>
        </p>
        <p className="mt-2 text-[13px] leading-snug font-semibold md:mt-4 md:text-[17px]">
          <span className="md:hidden">Druk w Warszawie · gotowe w {seller.leadTime}</span>
          <span className="hidden md:inline">
            Koszulka albo kubek z Twoim projektem · druk w Warszawie, gotowe w {seller.leadTime}
          </span>
        </p>
      </div>
      <PosterDoor product="tshirt" index={1} dark leaving={leaving} onPick={onPick} />
      <PosterDoor product="mug" index={2} leaving={leaving} onPick={onPick} />
      <p className="absolute right-5 bottom-1.5 z-30 text-[12px] text-[#16130F]/60 md:right-8 md:bottom-3">
        Nadruk na zdjęciu przykładowy ·{" "}
        <Link href="/prawne/regulamin" className="font-semibold underline underline-offset-2 hover:text-[#16130F]">
          Prawne
        </Link>
      </p>
    </section>
  );
}

function PosterDoor({
  product,
  index,
  dark = false,
  leaving,
  onPick,
}: {
  product: ProductId;
  index: number;
  dark?: boolean;
  leaving: ProductId | null;
  onPick: (id: ProductId) => void;
}) {
  const image = sampleImage(product, "poster");
  const gone = leaving !== null && leaving !== product;
  const taken = leaving === product;
  const isMug = product === "mug";
  return (
    <button
      type="button"
      onClick={() => onPick(product)}
      className={`door relative flex flex-1 overflow-hidden text-left ${
        dark ? "bg-[#16130F] pt-[118px] text-[#F3EEE4]" : "bg-[#F3EEE4] pb-5 text-[#16130F]"
      } md:pt-0 md:pb-0 ${gone ? "door-leave" : ""} ${taken ? "door-take" : ""}`}
    >
      <div className="flex w-full items-center gap-3 px-5 py-3 md:h-full md:flex-col md:items-stretch md:gap-0 md:px-10 md:pt-[max(220px,31vh)] md:pb-[max(28px,4.5vh)]">
        <div className="order-2 flex min-w-0 flex-1 flex-col md:order-2 md:flex-none">
          <p className="text-[12px] font-extrabold tracking-[0.14em] uppercase opacity-70 md:text-[13px]">
            0{index} — {isMug ? "Nadruk dookoła · 330 ml" : "Przód i tył · S–XL"}
          </p>
          <p className="font-poster mt-1 text-[28px] leading-[0.95] font-black md:mt-2 md:text-[length:clamp(44px,min(5vw,8vh),80px)]">
            {isMug ? "Kubek" : "Koszulka"}
          </p>
          <div className="mt-3 flex flex-col items-start gap-2 md:mt-[min(20px,2.4vh)] md:flex-row md:items-center md:gap-3">
            <PriceChip />
            <span className="poster-cta inline-flex items-center gap-2 rounded-full bg-[#E23B2F] px-5 py-3 text-[15px] font-extrabold text-white shadow-[0_14px_30px_-14px_rgba(226,59,47,0.9)] md:px-6 md:py-3.5 md:text-[16px]">
              Zrób własny
              <ArrowIcon />
            </span>
          </div>
        </div>
        <div className="door-art relative order-3 grid w-[40%] shrink-0 place-items-center md:order-1 md:min-h-0 md:w-full md:flex-1">
          <span
            className={`poster-disc absolute aspect-square rounded-full bg-[#C46A4A] md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 ${
              isMug ? "h-[108px] md:h-[74%]" : "h-[132px] md:h-[88%]"
            }`}
          />
          <Image
            src={image.src}
            width={image.width}
            height={image.height}
            alt=""
            priority
            sizes="(max-width: 768px) 45vw, 40vw"
            className={`relative w-auto max-w-none drop-shadow-[0_24px_30px_rgba(0,0,0,0.35)] md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 ${
              isMug ? "h-[136px] md:h-[80%]" : "h-[164px] md:h-full"
            }`}
          />
        </div>
      </div>
    </button>
  );
}

function PosterTop({
  product,
  onProduct,
  onHome,
  onCart,
  account,
}: {
  product: ProductId;
  onProduct: (id: ProductId) => void;
  onHome: () => void;
  onCart: () => void;
  account: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 bg-[#16130F] px-4 text-[#F3EEE4] md:h-[68px] md:px-8">
      <button type="button" onClick={onHome} aria-label="Wróć do wyboru rzeczy">
        <Wordmark />
      </button>
      <nav className="ml-8 hidden items-center gap-7 md:flex">
        {(["tshirt", "mug"] as const).map((id) => (
          <button
            key={id}
            type="button"
            aria-current={product === id ? "page" : undefined}
            onClick={() => onProduct(id)}
            className={`relative py-2 text-[15px] font-bold ${
              product === id
                ? "text-[#F3EEE4] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[3px] after:rounded-full after:bg-[#F2C14E]"
                : "text-[#F3EEE4]/60 hover:text-[#F3EEE4]"
            }`}
          >
            {id === "mug" ? "Kubek" : "Koszulka"}
          </button>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <CartButton onCart={onCart} />
        {account}
      </div>
    </header>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mt-5 mb-2 text-[12px] font-extrabold tracking-[0.14em] uppercase md:mt-[min(20px,2.2vh)] md:mb-1.5">{children}</p>;
}

function choice(selected: boolean) {
  return `rounded-xl border-2 px-4 py-2.5 text-[15px] font-bold transition-colors md:py-2 ${
    selected ? "border-[#16130F] bg-[#16130F] text-[#F3EEE4]" : "border-[#16130F]/12 bg-white/60 hover:border-[#16130F]"
  }`;
}

export function PosterShop({ work, onChange, onProduct, onHome, onCart, onEditor, account }: ShopViewProps) {
  const m = shopModel(work);
  const image = productImage(work.product, work.color);
  return (
    <section className="font-ui min-h-svh bg-[#F3EEE4] pb-24 text-[#16130F] md:pb-0">
      <PosterTop product={work.product} onProduct={onProduct} onHome={onHome} onCart={onCart} account={account} />
      <div className="grid md:min-h-[calc(100svh-68px)] md:grid-cols-[1.08fr_1fr]">
        <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden bg-[#16130F] pt-10 pb-12 md:min-h-0 md:py-0">
          <p
            aria-hidden
            className="font-poster pointer-events-none absolute inset-x-0 -bottom-[0.2em] text-center text-[clamp(52px,7vw,136px)] leading-none font-black text-[#231e18] select-none"
          >
            {m.product.name.toUpperCase()}
          </p>
          <span className="absolute aspect-square h-[58%] max-h-[500px] rounded-full bg-[#C46A4A]" />
          <Image
            key={image.src}
            src={image.src}
            width={image.width}
            height={image.height}
            alt={`${m.product.name}, kolor ${m.color.label.toLowerCase()}`}
            priority
            sizes="(max-width: 768px) 90vw, 50vw"
            className="rise relative h-[250px] w-auto drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)] md:h-[min(60vh,560px)]"
          />
          <div className="absolute top-4 left-4 flex rounded-full bg-[#F3EEE4]/10 p-1 md:hidden">
            {(["tshirt", "mug"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onProduct(id)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold ${
                  work.product === id ? "bg-[#F3EEE4] text-[#16130F]" : "text-[#F3EEE4]/70"
                }`}
              >
                {id === "mug" ? "Kubek" : "Koszulka"}
              </button>
            ))}
          </div>
          <div className="absolute right-4 bottom-4 left-4 flex flex-wrap gap-2 md:right-8 md:bottom-8 md:left-8">
            {m.product.zones.map((zone) => (
              <span
                key={zone.id}
                className="rounded-full border border-[#F3EEE4]/25 bg-[#16130F]/60 px-3 py-1.5 text-[12px] font-bold text-[#F3EEE4]"
              >
                {zone.label} · {zone.widthMm}×{zone.heightMm} mm
              </span>
            ))}
          </div>
        </div>
        <div className="px-5 py-7 md:px-12 md:pt-[min(36px,4vh)] md:pb-6 lg:px-16">
          <p className="text-[12px] font-extrabold tracking-[0.14em] text-[#6b6358] uppercase md:text-[13px]">
            Druk w Warszawie · gotowe w {seller.leadTime}
          </p>
          <h1 className="font-poster mt-2 text-[44px] leading-[0.95] font-black md:text-[length:clamp(40px,7vh,60px)]">{m.product.name}</h1>
          <div className="mt-4 flex items-center gap-3 md:mt-3">
            <PriceChip big />
            <p className="text-[13px] leading-snug text-[#6b6358]">
              Cena wyjściowa brutto.
              <br />
              Wiążącą podamy przed płatnością.
            </p>
          </div>
          {m.isShirt ? (
            <>
              <Label>Rozmiar</Label>
              <div className="flex flex-wrap gap-2">
                {m.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={work.size === size}
                    className={`${choice(work.size === size)} min-w-[52px]`}
                    onClick={() => onChange({ size })}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <Label>Pojemność</Label>
              <p className="text-[15px] font-bold">330 ml</p>
            </>
          )}
          <Label>
            Kolor <span className="ml-1 font-semibold tracking-normal normal-case text-[#6b6358]">{m.color.label}</span>
          </Label>
          <div className="flex items-center gap-3">
            {m.colors.map((swatch) => (
              <button
                key={swatch.id}
                type="button"
                aria-label={swatch.label}
                aria-pressed={work.color === swatch.value}
                className={`h-10 w-10 rounded-full border border-black/15 transition-transform hover:scale-105 md:h-9 md:w-9 ${
                  work.color === swatch.value ? "ring-[3px] ring-[#E23B2F] ring-offset-2 ring-offset-[#F3EEE4]" : ""
                }`}
                style={{ background: swatch.value }}
                onClick={() => onChange({ color: swatch.value })}
              />
            ))}
          </div>
          <Label>Nakład</Label>
          <div className="flex flex-wrap gap-2">
            {m.quantities.map((qty) => (
              <button
                key={qty}
                type="button"
                aria-pressed={work.qty === qty}
                className={choice(work.qty === qty)}
                onClick={() => onChange({ qty })}
              >
                {qty} szt.
              </button>
            ))}
          </div>
          <Label>Wykończenie</Label>
          <div className="flex flex-wrap gap-2">
            {m.finishes.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={work.finish === item.id}
                className={choice(work.finish === item.id)}
                onClick={() => onChange({ finish: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="sticky bottom-0 z-10 -mx-3 mt-6 hidden bg-[#F3EEE4] px-3 pt-2 pb-3 md:block">
            <button
              type="button"
              onClick={onEditor}
              className="poster-cta flex w-full items-center justify-center gap-2 rounded-full bg-[#E23B2F] px-6 py-4 text-[18px] font-extrabold text-white shadow-[0_18px_40px_-18px_rgba(226,59,47,0.9)] hover:bg-[#cf3127]"
            >
              Zrób własny
              <ArrowIcon />
            </button>
          </div>
          <p className="mt-3 text-[14px] text-[#6b6358] md:mt-1">Masz gotowy plik? Podepniemy go razem z zamówieniem.</p>
        </div>
      </div>
      <SiteFooter />
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 bg-[#16130F] px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden">
        <PriceChip />
        <button
          type="button"
          onClick={onEditor}
          className="poster-cta flex flex-1 items-center justify-center gap-2 rounded-full bg-[#E23B2F] px-5 py-3.5 text-[16px] font-extrabold text-white"
        >
          Zrób własny
          <ArrowIcon />
        </button>
      </div>
    </section>
  );
}
