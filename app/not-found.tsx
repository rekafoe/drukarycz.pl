import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { productPaths } from "@/lib/catalog";
import { seller } from "@/lib/seller";

export const metadata: Metadata = {
  title: `Nie ma takiej strony — ${seller.brand}`,
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col">
      <section className="mx-auto grid w-full max-w-3xl flex-1 content-center gap-4 px-5 py-12 md:px-7">
        <p className="text-sm font-semibold text-muted">Błąd 404</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Nie ma takiej strony</h1>
        <p className="text-muted">Adres mógł się zmienić albo strona została usunięta.</p>
        <nav className="mt-2 flex flex-wrap gap-2">
          <Link href="/" className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white">
            Strona główna
          </Link>
          <Link href={productPaths.tshirt} className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-bold">
            Koszulka
          </Link>
          <Link href={productPaths.mug} className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-bold">
            Kubek
          </Link>
        </nav>
      </section>
      <SiteFooter />
    </main>
  );
}
