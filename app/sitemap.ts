import type { MetadataRoute } from "next";
import { legalSlugs } from "@/components/legal-documents";
import { productPaths } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

/** Без changefreq и priority: Google их не читает, а угадывать частоту правок незачем. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/") },
    ...Object.values(productPaths).map((path) => ({ url: absoluteUrl(path) })),
    { url: absoluteUrl("/wzory") },
    ...legalSlugs.map((slug) => ({ url: absoluteUrl(`/prawne/${slug}`) })),
  ];
}
