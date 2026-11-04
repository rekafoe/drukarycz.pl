import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, BrandMark, coralButton } from "@/components/brand";
import { ProductStage } from "@/components/product-art";
import { seller } from "@/lib/seller";

export const metadata: Metadata = {
  title: `Nie ma takiej strony — ${seller.brand}`,
};

export default function NotFound() {
  return (
    <main className="on-poster halftone grid min-h-dvh grid-rows-[auto_1fr] bg-poster px-5 py-6 text-cream md:px-10">
      <Link href="/" className="text-lg md:text-2xl" aria-label={`${seller.brand} — start`}>
        <BrandMark />
      </Link>
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <div className="grid gap-4">
          <p className="text-[12px] font-bold tracking-[0.16em] text-cream/55 uppercase">Błąd 404</p>
          <h1 className="font-display text-[40px] leading-[0.98] font-extrabold tracking-[-0.03em] md:text-[64px]">
            Tej strony nie ma.
          </h1>
          <p className="max-w-sm text-cream/70">Link jest stary albo ma literówkę. Koszulka i kubek czekają na stronie głównej.</p>
          <Link href="/" className={`${coralButton} mt-2 w-fit px-5 py-3.5 text-base`}>
            Zrób własny
            <ArrowIcon />
          </Link>
        </div>
        <ProductStage product="mug" color="#f7f4ef" board="clay" text="Ups." tilt={6} className="w-[min(70vw,340px)] justify-self-center" />
      </div>
    </main>
  );
}
