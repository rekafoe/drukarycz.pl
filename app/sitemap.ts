import type { MetadataRoute } from "next";
import { legalSlugs } from "@/components/legal-documents";
import { productPaths } from "@/lib/catalog";
import { landingSitemapPaths } from "@/lib/landings";
import { absoluteUrl } from "@/lib/site";

/** Без changefreq и priority: Google их не читает, а угадывать частоту правок незачем. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/") },
    ...Object.values(productPaths).map((path) => ({ url: absoluteUrl(path) })),
    { url: absoluteUrl("/wzory") },
    ...landingSitemapPaths().map((path) => ({ url: absoluteUrl(path) })),
    ...legalSlugs.map((slug) => ({ url: absoluteUrl(`/prawne/${slug}`) })),
  ];
}
