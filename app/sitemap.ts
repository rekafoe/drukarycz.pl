import type { MetadataRoute } from "next";
import { legalSlugs } from "@/components/legal-documents";
import { productPaths } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    ...Object.values(productPaths).map((path) => ({
      url: absoluteUrl(path),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...legalSlugs.map((slug) => ({
      url: absoluteUrl(`/prawne/${slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
