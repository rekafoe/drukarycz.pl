import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalArticle, isLegalSlug, legalSlugs, legalTitles } from "@/components/legal-documents";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { seller } from "@/lib/seller";

export function generateStaticParams() {
  return legalSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isLegalSlug(slug)) return { title: seller.brand };
  return { title: `${legalTitles[slug]} — ${seller.brand}` };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();
  return (
    <main className="min-h-dvh bg-cream text-poster">
      <SiteHeader />
      <div className="on-poster halftone bg-poster text-cream">
        <div className="mx-auto max-w-6xl px-5 pt-10 pb-12 md:px-7 md:pt-14 md:pb-16">
          <p className="text-[12px] font-bold tracking-[0.16em] text-cream/55 uppercase">Informacje prawne</p>
          <h1 className="mt-3 font-display text-[34px] leading-[1.02] font-extrabold tracking-[-0.03em] md:text-[56px]">
            {legalTitles[slug]}
          </h1>
          <p className="mt-4 text-sm text-cream/60">{seller.brand} · wersja serwisu z 28 października 2026</p>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:px-7 md:py-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
        <nav aria-label="Dokumenty" className="no-scrollbar -mx-5 overflow-x-auto px-5 lg:mx-0 lg:overflow-visible lg:px-0">
          <ul className="flex gap-2 lg:sticky lg:top-24 lg:grid lg:gap-1">
            {legalSlugs.map((item) => {
              const current = item === slug;
              return (
                <li key={item} className="shrink-0">
                  <a
                    href={`/prawne/${item}`}
                    aria-current={current ? "page" : undefined}
                    className={`block rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap lg:rounded-xl ${
                      current ? "bg-poster text-cream" : "border border-line bg-white hover:border-poster lg:border-transparent lg:bg-transparent"
                    }`}
                  >
                    {legalTitles[item]}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <article className="max-w-2xl">
          <LegalArticle slug={slug} />
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
