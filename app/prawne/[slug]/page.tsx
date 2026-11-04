import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalArticle, isLegalSlug, legalSlugs, legalTitles } from "@/components/legal-documents";
import { PosterHeader } from "@/components/poster-chrome";
import { SiteFooter } from "@/components/site-footer";
import { seller } from "@/lib/seller";
import { legalDescriptions, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return legalSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isLegalSlug(slug)) return { title: seller.brand };
  return pageMetadata({
    title: `${legalTitles[slug]} — ${seller.brand}`,
    description: legalDescriptions[slug],
    path: `/prawne/${slug}`,
  });
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isLegalSlug(slug)) notFound();
  return (
    <main className="min-h-screen bg-[#F3EEE4]">
      <PosterHeader current="home" />
      <article className="mx-auto max-w-3xl px-5 py-8 md:px-7">
        <Link href="/" className="text-sm font-bold text-(--a-mark) hover:underline">
          ← {seller.brand}
        </Link>
        <LegalArticle slug={slug} />
      </article>
      <SiteFooter />
    </main>
  );
}
