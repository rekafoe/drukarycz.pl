import type { Metadata } from "next";
import Link from "next/link";
import { PosterHeader } from "@/components/poster-chrome";
import { SiteFooter } from "@/components/site-footer";
import { productPaths } from "@/lib/catalog";
import { seller } from "@/lib/seller";

export const metadata: Metadata = {
  title: `Nie ma takiej strony — ${seller.brand}`,
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-[#F3EEE4]">
      <PosterHeader current="home" />
      <section className="mx-auto grid w-full max-w-3xl flex-1 content-center gap-4 px-5 py-12 md:px-7">
        <p className="text-[12px] font-extrabold tracking-[0.14em] text-[#6b6358] uppercase">Błąd 404</p>
        <h1 className="font-poster text-[44px] leading-[0.95] font-black tracking-tight md:text-[60px]">Nie ma takiej strony</h1>
        <p className="text-muted">Adres mógł się zmienić albo strona została usunięta.</p>
        <nav className="mt-2 flex flex-wrap gap-2">
          <Link href="/" className="btn-kobalt">
            Strona główna
          </Link>
          <Link href={productPaths.tshirt} className="btn-ghost">
            Koszulka
          </Link>
          <Link href={productPaths.mug} className="btn-ghost">
            Kubek
          </Link>
          <Link href="/wzory" className="btn-ghost">
            Wzory
          </Link>
        </nav>
      </section>
      <SiteFooter />
    </main>
  );
}
