import type { MetadataRoute } from "next";
import { seller } from "@/lib/seller";
import { homeSeo } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: seller.brand,
    short_name: seller.brand,
    description: homeSeo.description,
    lang: "pl",
    start_url: "/",
    display: "browser",
    background_color: "#f3f0ea",
    theme_color: "#f3f0ea",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
