"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ProductId } from "@/lib/catalog";
import { SiteFooter } from "@/components/site-footer";
import { seller } from "@/lib/seller";
import {
  ArrowIcon,
  productImage,
  sampleImage,
  shopModel,
  teeFrontZone,
  type DoorsViewProps,
  type ShopViewProps,
} from "./kit";

const line = "border-[#141414]";

function CropMarks() {
  return (
    <span className="grid-crop pointer-events-none absolute inset-0" aria-hidden>
      <span className="crop-mark top-0 left-0 border-t-[1.5px] border-l-[1.5px]" />
      <span className="crop-mark top-0 right-0 border-t-[1.5px] border-r-[1.5px]" />
      <span className="crop-mark bottom-0 left-0 border-b-[1.5px] border-l-[1.5px]" />
      <span className="crop-mark right-0 bottom-0 border-r-[1.5px] border-b-[1.5px]" />
    </span>
  );
}

function PriceBox({ big = false }: { big?: boolean }) {
  return (
    <span
      className={`font-plex inline-flex shrink-0 items-center border-[1.5px] ${line} bg-white font-semibold ${
        big ? "px-5 py-3.5 text-[22px]" : "px-3.5 py-2.5 text-[15px]"
      }`}
    >
      {seller.priceFrom}
    </span>
  );
}

function GridTop({
  sheet,
  product,
  onProduct,
  onHome,
  onCart,
  account,
}: {
  sheet: string;
  product?: ProductId;
  onProduct?: (id: ProductId) => void;
  onHome?: () => void;
  onCart: () => void;
  account: ReactNode;
}) {
  return (
    <>
      <header className={`flex h-[60px] items-center gap-5 border-b-[1.5px] ${line} bg-[#FBFBF8] px-4 md:px-8`}>
        <button
          type="button"
          onClick={onHome}
          disabled={!onHome}
          className="text-[19px] font-extrabold tracking-[-0.03em] md:text-[21px]"
        >
          {seller.brand}
        </button>
        {product && onProduct ? (
          <nav className="font-plex ml-4 hidden items-center gap-1 text-[13px] md:flex">
            {(["tshirt", "mug"] as const).map((id, index) => (
              <button
                key={id}
                type="button"
                aria-current={product === id ? "page" : undefined}
                onClick={() => onProduct(id)}
                className={`border-[1.5px] px-3 py-1.5 ${
                  product === id ? `${line} bg-[#141414] text-white` : "border-transparent hover:border-[#141414]"
                }`}
              >
                0{index + 1} {id === "mug" ? "KUBEK" : "KOSZULKA"}
              </button>
            ))}
          </nav>
        ) : null}
        <span className="font-plex ml-auto hidden text-[12px] text-[#6b6b66] lg:block">{sheet}</span>
        <div className="ml-auto flex items-center gap-2 lg:ml-6">
          <button
            type="button"
            onClick={onCart}
            className={`font-plex border-[1.5px] ${line} bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-[#141414] hover:text-white`}
          >
            KOSZYK
          </button>
          {account}
        </div>
      </header>
      <div className={`grid-ruler h-3 border-b-[1.5px] ${line}`} aria-hidden />
    </>
  );
}

export function GridDoors({ leaving, onPick, onCart, account }: DoorsViewProps) {
  return (
    <section className="font-ui flex min-h-svh flex-col bg-[#FBFBF8] text-[#141414]">
      <GridTop sheet="ARKUSZ 00 · WYBÓR RZECZY · SKALA 1:5" onCart={onCart} account={account} />
      <h1 className={`border-b-[1.5px] ${line} px-4 py-3 text-[26px] leading-tight font-extrabold tracking-[-0.03em] md:px-8 md:py-4 md:text-[34px]`}>
        Własny nadruk. Dwie rzeczy, jeden arkusz.
      </h1>
      <div className="doors flex flex-1 flex-col md:flex-row">
        <GridCell product="tshirt" index="01" leaving={leaving} onPick={onPick} />
        <GridCell product="mug" index="02" leaving={leaving} onPick={onPick} />
      </div>
      <div className={`font-plex grid grid-cols-3 border-t-[1.5px] ${line} text-[11px] md:text-[12px]`}>
        {[
          ["03", `Druk ${seller.leadTime}`],
          ["04", "Plik do druku 300 dpi"],
          ["05", "Podgląd 3D przed zamówieniem"],
        ].map(([n, text], index) => (
          <p key={n} className={`px-3 py-3 md:px-8 md:py-4 ${index > 0 ? `border-l-[1.5px] ${line}` : ""}`}>
            <span className="text-[#E23B2F]">{n}</span> {text.toUpperCase()}
          </p>
        ))}
      </div>
      <p className={`font-plex flex justify-between gap-3 border-t-[1.5px] ${line} px-3 py-2 text-[11px] text-[#6b6b66] md:px-8`}>
        <span>NADRUKI NA ZDJĘCIACH PRZYKŁADOWE</span>
        <Link href="/prawne/regulamin" className="underline underline-offset-2 hover:text-[#141414]">
          PRAWNE
        </Link>
      </p>
    </section>
  );
}

function GridCell({
  product,
  index,
  leaving,
  onPick,
}: {
  product: ProductId;
  index: string;
  leaving: ProductId | null;
  onPick: (id: ProductId) => void;
}) {
  const image = sampleImage(product, "grid");
  const isMug = product === "mug";
  const gone = leaving !== null && leaving !== product;
  const taken = leaving === product;
  return (
    <button
      type="button"
      onClick={() => onPick(product)}
      className={`door grid-cell relative flex flex-1 flex-col text-left ${
        isMug ? `border-t-[1.5px] ${line} md:border-t-0 md:border-l-[1.5px]` : ""
      } ${gone ? "door-leave" : ""} ${taken ? "door-take" : ""}`}
    >
      <span className="grid-paper-hover grid-paper absolute inset-0" aria-hidden />
      <div className="font-plex relative flex items-start justify-between gap-3 px-4 pt-3 text-[11px] md:px-8 md:pt-5 md:text-[12px]">
        <span>
          {index} / {isMug ? "KUBEK" : "KOSZULKA"}
        </span>
        <span className="text-[#6b6b66]">{isMug ? "OBWÓD 200×85 MM · 330 ML" : "PRZÓD + TYŁ 300×400 MM"}</span>
      </div>
      <div className="relative flex min-h-[176px] flex-1 items-center justify-center py-3 md:py-8">
        <div className="relative px-4 py-3">
          <CropMarks />
          <Image
            src={image.src}
            width={image.width}
            height={image.height}
            alt=""
            priority
            sizes="(max-width: 768px) 50vw, 35vw"
            className={`w-auto ${isMug ? "h-[128px] md:h-[min(34vh,320px)]" : "h-[150px] md:h-[min(42vh,400px)]"}`}
          />
        </div>
      </div>
      <div className={`relative flex flex-wrap items-center justify-between gap-3 border-t-[1.5px] ${line} px-4 py-3 md:px-8 md:py-5`}>
        <p className="flex items-baseline gap-2">
          <span className="font-plex text-[13px] text-[#E23B2F]">{index}</span>
          <span className="text-[30px] leading-none font-extrabold tracking-[-0.04em] md:text-[44px]">
            {isMug ? "Kubek" : "Koszulka"}
          </span>
        </p>
        <span className="flex items-stretch">
          <PriceBox />
          <span className="inline-flex items-center gap-2 bg-[#141414] px-4 py-2.5 text-[15px] font-bold text-white md:px-5">
            Zrób własny
            <ArrowIcon width={18} height={18} />
          </span>
        </span>
      </div>
    </button>
  );
}

function Row({ n, label, children }: { n: string; label: string; children: ReactNode }) {
  return (
    <div className={`grid grid-cols-[96px_1fr] items-center gap-3 border-b-[1.5px] ${line} px-4 py-3.5 md:grid-cols-[132px_1fr] md:px-8`}>
      <span className="font-plex text-[11px] text-[#6b6b66] md:text-[12px]">
        <span className="text-[#E23B2F]">{n}</span> {label.toUpperCase()}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function box(selected: boolean) {
  return `font-plex min-w-[46px] border-[1.5px] px-3 py-2 text-[14px] font-semibold ${
    selected ? `${line} bg-[#141414] text-white` : "border-[#141414]/25 bg-white hover:border-[#141414]"
  }`;
}

export function GridShop({ work, onChange, onProduct, onHome, onCart, onEditor, account, chosen, showcase }: ShopViewProps) {
  const m = shopModel(work);
  const image = productImage(work.product, work.color);
  const front = m.product.zones[0];
  return (
    <section className="font-ui min-h-svh bg-[#FBFBF8] pb-24 text-[#141414] md:pb-0">
      <GridTop
        sheet={`ARKUSZ 01 · ${m.product.name.toUpperCase()} · SKALA 1:5`}
        product={work.product}
        onProduct={onProduct}
        onHome={onHome}
        onCart={onCart}
        account={account}
      />
      <div className="grid md:min-h-[calc(100svh-75px)] md:grid-cols-[1.2fr_1fr]">
        <div className={`grid-paper relative flex min-h-[400px] items-center justify-center border-b-[1.5px] ${line} px-6 pt-20 pb-12 md:border-r-[1.5px] md:border-b-0 md:p-6`}>
          <span className="font-plex absolute top-3 left-4 text-[11px] md:left-6">
            {m.product.name.toUpperCase()} · {front.label.toUpperCase()}
          </span>
          <span className="font-plex absolute top-3 right-4 text-[11px] text-[#6b6b66] md:right-6">SKALA 1:5</span>
          <div className="absolute top-9 left-4 flex md:hidden">
            {(["tshirt", "mug"] as const).map((id, index) => (
              <button
                key={id}
                type="button"
                onClick={() => onProduct(id)}
                className={`font-plex border-[1.5px] px-2.5 py-1 text-[12px] ${
                  work.product === id ? `${line} bg-[#141414] text-white` : "border-[#141414]/25 bg-white"
                }`}
              >
                0{index + 1} {id === "mug" ? "KUBEK" : "KOSZULKA"}
              </button>
            ))}
          </div>
          <figure className="relative">
            <Image
              key={image.src}
              src={image.src}
              width={image.width}
              height={image.height}
              alt={`${m.product.name}, kolor ${m.color.label.toLowerCase()}`}
              priority
              sizes="(max-width: 768px) 90vw, 50vw"
              className="h-[270px] w-auto md:h-[min(66vh,620px)]"
            />
            {m.isShirt ? (
              <span
                className="absolute border-[1.5px] border-dashed border-[#E23B2F]"
                style={{
                  left: `${teeFrontZone.left}%`,
                  top: `${teeFrontZone.top}%`,
                  width: `${teeFrontZone.width}%`,
                  height: `${teeFrontZone.height}%`,
                }}
              >
                <span className="font-plex absolute -top-6 left-0 flex w-full items-center gap-1 text-[11px] text-[#E23B2F]">
                  <span className="h-px flex-1 bg-[#E23B2F]" />
                  {front.widthMm} MM
                  <span className="h-px flex-1 bg-[#E23B2F]" />
                </span>
                <span className="font-plex absolute top-0 -right-8 flex h-full flex-col items-center gap-1 text-[11px] text-[#E23B2F] [writing-mode:vertical-rl]">
                  <span className="w-px flex-1 bg-[#E23B2F]" />
                  {front.heightMm} MM
                  <span className="w-px flex-1 bg-[#E23B2F]" />
                </span>
              </span>
            ) : (
              <span className="font-plex absolute right-0 -bottom-7 left-0 text-center text-[11px] text-[#E23B2F]">
                OBWÓD {front.widthMm}×{front.heightMm} MM, OD UCHA DO UCHA
              </span>
            )}
          </figure>
          <span className="font-plex absolute bottom-3 left-4 text-[11px] text-[#6b6b66] md:left-6">{m.zonesLine.toUpperCase()}</span>
        </div>
        <div className="flex flex-col">
          <Row n="01" label="Rzecz">
            <h1 className="text-[34px] leading-none font-extrabold tracking-[-0.04em] md:text-[44px]">{m.product.name}</h1>
          </Row>
          {m.isShirt ? (
            <Row n="02" label="Rozmiar">
              <div className="flex flex-wrap gap-1.5">
                {m.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={work.size === size}
                    className={box(work.size === size)}
                    onClick={() => onChange({ size })}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </Row>
          ) : (
            <Row n="02" label="Pojemność">
              <span className="font-plex text-[14px] font-semibold">330 ML</span>
            </Row>
          )}
          <Row n="03" label="Kolor">
            <div className="flex flex-wrap items-center gap-1.5">
              {m.colors.map((swatch) => (
                <button
                  key={swatch.id}
                  type="button"
                  aria-label={swatch.label}
                  aria-pressed={work.color === swatch.value}
                  className={`h-9 w-9 border-[1.5px] ${
                    work.color === swatch.value ? "border-[#E23B2F] outline-[1.5px] outline-offset-2 outline-[#141414] outline" : "border-[#141414]/30"
                  }`}
                  style={{ background: swatch.value }}
                  onClick={() => onChange({ color: swatch.value })}
                />
              ))}
              <span className="font-plex ml-2 text-[12px]">{m.color.label.toUpperCase()}</span>
            </div>
          </Row>
          <Row n="04" label="Nakład">
            <div className="flex flex-wrap items-center gap-1.5">
              {m.quantities.map((qty) => (
                <button
                  key={qty}
                  type="button"
                  aria-pressed={work.qty === qty}
                  className={box(work.qty === qty)}
                  onClick={() => onChange({ qty })}
                >
                  {qty}
                </button>
              ))}
              <span className="font-plex ml-1 text-[12px]">SZT.</span>
            </div>
          </Row>
          <Row n="05" label="Czas">
            <span className="font-plex text-[13px]">{seller.leadTime.toUpperCase()} · WARSZAWA</span>
          </Row>
          <div className="hidden items-stretch gap-0 px-8 py-6 md:flex">
            <span className="flex flex-col justify-center">
              <PriceBox big />
            </span>
            <button
              type="button"
              onClick={onEditor}
              className="flex flex-1 items-center justify-center gap-3 bg-[#141414] px-6 text-[19px] font-extrabold text-white hover:bg-[#E23B2F]"
            >
              Zrób własny
              <ArrowIcon />
            </button>
          </div>
          {chosen}
          <p className="font-plex px-4 pt-3 text-[11px] leading-relaxed text-[#6b6b66] md:px-8 md:pt-0">
            CENA WYJŚCIOWA BRUTTO. WIĄŻĄCA — PRZED PŁATNOŚCIĄ. GOTOWY PLIK PODEPNIEMY DO ZAMÓWIENIA.
          </p>
        </div>
      </div>
      {showcase}
      <SiteFooter />
      <div className={`fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t-[1.5px] ${line} bg-[#FBFBF8] px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden`}>
        <PriceBox />
        <button
          type="button"
          onClick={onEditor}
          className="flex flex-1 items-center justify-center gap-2 bg-[#141414] px-4 py-3 text-[16px] font-extrabold text-white"
        >
          Zrób własny
          <ArrowIcon width={18} height={18} />
        </button>
      </div>
    </section>
  );
}
