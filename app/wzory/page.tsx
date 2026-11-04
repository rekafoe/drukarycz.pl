import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { WzoryBrowser } from "@/components/wzory/wzory-browser";
import { WzoryHeader } from "@/components/wzory/wzory-header";
import { pageMetadata, wzorySeo } from "@/lib/seo";
import { productFromSlug } from "@/lib/wzory/types";

export const metadata: Metadata = pageMetadata(wzorySeo);

export default async function WzoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { produkt } = await searchParams;
  const product = productFromSlug(Array.isArray(produkt) ? produkt[0] : produkt) ?? "tshirt";
  return (
    <main className="min-h-full bg-[#F3EEE4]">
      <WzoryHeader />
      <WzoryBrowser initialProduct={product} />
      <SiteFooter />
    </main>
  );
}
