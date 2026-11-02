import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalArticle, isLegalSlug, legalSlugs, legalTitles } from "@/components/legal-documents";
import { SiteFooter } from "@/components/site-footer";
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
    <main>
      <article className="mx-auto max-w-3xl px-5 py-8 md:px-7">
        <a href="/" className="text-sm font-semibold text-muted">
          ← {seller.brand}
        </a>
        <LegalArticle slug={slug} />
      </article>
      <SiteFooter />
    </main>
  );
}
