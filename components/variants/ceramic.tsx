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
  ClockIcon,
  CubeIcon,
  SheetIcon,
  productImage,
  sampleImage,
  shopModel,
  type DoorsViewProps,
  type ShopViewProps,
} from "./kit";

const [brandName, brandTld] = seller.brand.split(".");

function Wordmark() {
  return (
    <span className="font-soft text-[22px] font-semibold md:text-[26px]">
      {brandName}
      <span className="text-[#C46A4A]">.</span>
      {brandTld}
    </span>
  );
}

function PricePill({ big = false }: { big?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-white font-extrabold text-[#2E2421] shadow-[0_6px_18px_-10px_rgba(92,50,36,0.6)] ${
        big ? "px-5 py-2.5 text-[22px]" : "px-4 py-2 text-[15px]"
      }`}
    >
      {seller.priceFrom}
    </span>
  );
}

function CeramicTop({
  product,
  onProduct,
  onHome,
  onCart,
  account,
}: {
  product?: ProductId;
  onProduct?: (id: ProductId) => void;
  onHome?: () => void;
  onCart: () => void;
  account: ReactNode;
}) {
  return (
    <header className="mx-auto flex h-[68px] max-w-[1280px] items-center gap-6 px-5 md:h-[76px] md:px-8">
      <button type="button" onClick={onHome} disabled={!onHome} aria-label="Wróć do wyboru rzeczy">
        <Wordmark />
      </button>
      {product && onProduct ? (
        <nav className="hidden items-center gap-1 rounded-full bg-white/45 p-1 md:flex">
          {(["tshirt", "mug"] as const).map((id) => (
            <button
              key={id}
              type="button"
              aria-current={product === id ? "page" : undefined}
              onClick={() => onProduct(id)}
              className={`rounded-full px-4 py-1.5 text-[14px] font-bold ${
                product === id ? "bg-white text-[#2E2421] shadow-sm" : "text-[#7A625A] hover:text-[#2E2421]"
              }`}
            >
              {id === "mug" ? "Kubek" : "Koszulka"}
            </button>
          ))}
        </nav>
      ) : null}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onCart}
          className="inline-flex items-center gap-2 rounded-full border border-[#2E2421]/20 bg-white/40 px-3.5 py-2 text-sm font-bold hover:bg-white/70"
        >
          <BagIcon width={18} height={18} />
          <span className="hidden sm:inline">Koszyk</span>
        </button>
        {account}
      </div>
    </header>
  );
}

export function CeramicDoors({ leaving, onPick, onCart, account }: DoorsViewProps) {
  return (
    <section className="font-ui ceramic-bg relative min-h-svh text-[#2E2421]">
      <CeramicTop onCart={onCart} account={account} />
      <div className="mx-auto max-w-[1280px] px-4 pb-10 md:px-8">
        <div className="px-1 md:flex md:items-end md:justify-between md:gap-10">
          <h1 className="font-soft text-[32px] leading-[1.02] font-semibold md:text-[64px]">
            Twoja rzecz,
            <br />
            Twój nadruk.
          </h1>
          <p className="mt-2 max-w-[36ch] text-[14px] leading-snug text-[#7A625A] md:mt-0 md:mb-2 md:text-[17px]">
            Na prezent albo dla siebie. Druk w Warszawie, gotowe w {seller.leadTime}.
          </p>
        </div>
        <div className="doors mt-5 flex flex-col gap-3.5 md:mt-8 md:h-[min(66vh,620px)] md:flex-row md:gap-6">
          <CeramicCard product="tshirt" plate="#E6B6A3" tag="Dla siebie i ekipy" leaving={leaving} onPick={onPick} />
          <CeramicCard product="mug" plate="#CBD9C6" tag="Na prezent" leaving={leaving} onPick={onPick} />
        </div>
        <p className="mt-5 text-center text-[13px] text-[#7A625A]">
          Nadruki na zdjęciach są przykładowe.{" "}
          <Link href="/prawne/regulamin" className="font-semibold underline underline-offset-2">
            Prawne
          </Link>
        </p>
      </div>
    </section>
  );
}

function CeramicCard({
  product,
  plate,
  tag,
  leaving,
  onPick,
}: {
  product: ProductId;
  plate: string;
  tag: string;
  leaving: ProductId | null;
  onPick: (id: ProductId) => void;
}) {
  const image = sampleImage(product, "leaf");
  const isMug = product === "mug";
  const gone = leaving !== null && leaving !== product;
  const taken = leaving === product;
  return (
    <button
      type="button"
      onClick={() => onPick(product)}
      className={`door ceramic-card relative flex flex-1 items-center gap-3 overflow-hidden rounded-[28px] bg-[#FBF4EE] p-4 text-left md:flex-col md:items-stretch md:gap-0 md:rounded-[36px] md:p-7 ${
        gone ? "door-leave" : ""
      } ${taken ? "door-take" : ""}`}
    >
      <div className="relative order-2 grid w-[44%] shrink-0 place-items-center self-stretch md:order-1 md:w-full md:flex-1">
        <span
          className="ceramic-plate absolute aspect-square h-[150px] rounded-full md:h-[min(36vh,350px)]"
          style={{ background: plate }}
        />
        <Image
          src={image.src}
          width={image.width}
          height={image.height}
          alt=""
          priority
          sizes="(max-width: 768px) 45vw, 40vw"
          className={`door-art relative w-auto drop-shadow-[0_22px_24px_rgba(92,50,36,0.35)] ${
            isMug ? "h-[128px] md:h-[min(29vh,280px)]" : "h-[166px] md:h-[min(38vh,370px)]"
          }`}
        />
      </div>
      <div className="order-1 flex min-w-0 flex-1 flex-col gap-2 md:order-2 md:mt-4 md:flex-none md:flex-row md:items-end md:justify-between md:gap-4">
        <div>
          <span className="inline-block rounded-full bg-[#F3E2D8] px-3 py-1 text-[12px] font-bold text-[#9A5A43]">{tag}</span>
          <p className="font-soft mt-2 text-[34px] leading-none font-semibold md:text-[52px]">{isMug ? "Kubek" : "Koszulka"}</p>
          <p className="mt-1.5 text-[13px] text-[#7A625A] md:text-[15px]">
            {isMug ? "Nadruk dookoła · 330 ml" : "Przód i tył · S–XL"}
          </p>
        </div>
        <div className="mt-1 flex flex-col items-start gap-2 md:mt-0 md:flex-row md:items-center md:gap-3">
          <PricePill />
          <span className="inline-flex items-center gap-2 rounded-full bg-[#2F5D46] px-5 py-3 text-[15px] font-bold text-white shadow-[0_12px_24px_-12px_rgba(47,93,70,0.9)] md:px-6 md:py-3.5">
            Zrób własny
            <ArrowIcon width={18} height={18} />
          </span>
        </div>
      </div>
    </button>
  );
}

function pill(selected: boolean) {
  return `rounded-full px-4 py-2.5 text-[15px] font-bold transition-all ${
    selected
      ? "bg-[#2F5D46] text-white shadow-[0_8px_18px_-10px_rgba(47,93,70,0.9)]"
      : "bg-white text-[#2E2421] shadow-[0_4px_12px_-8px_rgba(92,50,36,0.5)] hover:-translate-y-0.5"
  }`;
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mt-5 mb-2 text-[14px] font-bold text-[#7A625A]">{children}</p>;
}

export function CeramicShop({ work, onChange, onProduct, onHome, onCart, onEditor, account }: ShopViewProps) {
  const m = shopModel(work);
  const image = productImage(work.product, work.color);
  return (
    <section className="font-ui ceramic-bg min-h-svh pb-28 text-[#2E2421] md:pb-10">
      <CeramicTop product={work.product} onProduct={onProduct} onHome={onHome} onCart={onCart} account={account} />
      <div className="mx-auto max-w-[1280px] px-3 md:px-8">
        <div className="ceramic-card rounded-[32px] bg-[#FBF4EE] p-3 md:grid md:grid-cols-[1.08fr_1fr] md:gap-10 md:rounded-[40px] md:p-6">
          <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-[26px] bg-[#F1DDD2] pt-12 pb-12 md:min-h-[min(74vh,640px)] md:rounded-[32px] md:py-0">
            <span className="absolute aspect-square h-[76%] rounded-full bg-[#E6B6A3]" />
            <Image
              key={image.src}
              src={image.src}
              width={image.width}
              height={image.height}
              alt={`${m.product.name}, kolor ${m.color.label.toLowerCase()}`}
              priority
              sizes="(max-width: 768px) 90vw, 50vw"
              className="rise relative h-[240px] w-auto drop-shadow-[0_26px_30px_rgba(92,50,36,0.35)] md:h-[min(60vh,540px)]"
            />
            <div className="absolute top-3 left-3 flex rounded-full bg-white/60 p-1 md:hidden">
              {(["tshirt", "mug"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onProduct(id)}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold ${
                    work.product === id ? "bg-white shadow-sm" : "text-[#7A625A]"
                  }`}
                >
                  {id === "mug" ? "Kubek" : "Koszulka"}
                </button>
              ))}
            </div>
            <div className="absolute right-3 bottom-3 left-3 flex flex-wrap gap-2 md:right-5 md:bottom-5 md:left-5">
              {m.product.zones.map((zone) => (
                <span key={zone.id} className="rounded-full bg-white/75 px-3 py-1.5 text-[12px] font-bold backdrop-blur">
                  {zone.label} · {zone.widthMm}×{zone.heightMm} mm
                </span>
              ))}
            </div>
          </div>
          <div className="px-2 pt-6 pb-2 md:px-0 md:pt-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3E2D8] px-3 py-1 text-[12px] font-bold text-[#9A5A43]">
              <ClockIcon width={14} height={14} />
              Gotowe w {seller.leadTime}
            </span>
            <h1 className="font-soft mt-3 text-[42px] leading-none font-semibold md:text-[58px]">{m.product.name}</h1>
            <div className="mt-4 flex items-center gap-3">
              <PricePill big />
              <p className="text-[13px] leading-snug text-[#7A625A]">
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
                      className={`${pill(work.size === size)} min-w-[52px]`}
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
              Kolor · <span className="text-[#2E2421]">{m.color.label}</span>
            </Label>
            <div className="flex items-center gap-3">
              {m.colors.map((swatch) => (
                <button
                  key={swatch.id}
                  type="button"
                  aria-label={swatch.label}
                  aria-pressed={work.color === swatch.value}
                  className={`h-10 w-10 rounded-full border-[3px] border-white shadow-[0_4px_12px_-6px_rgba(92,50,36,0.7)] transition-transform hover:scale-105 ${
                    work.color === swatch.value ? "ring-2 ring-[#2F5D46] ring-offset-2 ring-offset-[#FBF4EE]" : ""
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
                  className={pill(work.qty === qty)}
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
                  className={pill(work.finish === item.id)}
                  onClick={() => onChange({ finish: item.id })}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onEditor}
              className="mt-7 hidden w-full items-center justify-center gap-2 rounded-full bg-[#2F5D46] px-6 py-5 text-[18px] font-bold text-white shadow-[0_18px_36px_-18px_rgba(47,93,70,0.95)] hover:bg-[#264D3A] md:flex"
            >
              Zrób własny
              <ArrowIcon />
            </button>
            <p className="mt-3 text-[14px] text-[#7A625A]">Masz gotowy plik? Podepniemy go razem z zamówieniem.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:mt-6 md:grid-cols-3">
          {[
            { icon: <CubeIcon />, title: "Podgląd 3D", line: "Zobaczysz nadruk na rzeczy, zanim zamówisz." },
            { icon: <SheetIcon />, title: "Plik 300 dpi", line: "Edytor ostrzeże przed zbyt słabym zdjęciem." },
            { icon: <ClockIcon />, title: `Gotowe w ${seller.leadTime}`, line: "Od jednej sztuki, druk w Warszawie." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-[24px] bg-[#FBF4EE]/80 p-4 shadow-[0_10px_30px_-24px_rgba(92,50,36,0.8)]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F3E2D8] text-[#9A5A43]">{item.icon}</span>
              <span>
                <span className="block font-bold">{item.title}</span>
                <span className="block text-[14px] text-[#7A625A]">{item.line}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8">
        <SiteFooter />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 bg-[#FBF4EE]/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-12px_30px_-20px_rgba(92,50,36,0.6)] backdrop-blur md:hidden">
        <PricePill />
        <button
          type="button"
          onClick={onEditor}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2F5D46] px-5 py-3.5 text-[16px] font-bold text-white"
        >
          Zrób własny
          <ArrowIcon width={18} height={18} />
        </button>
      </div>
    </section>
  );
}
