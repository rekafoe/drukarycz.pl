import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** /m/* не закрываем здесь: там noindex, и поисковик должен его прочитать. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
