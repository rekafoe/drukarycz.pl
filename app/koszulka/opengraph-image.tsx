import { ogCard, ogContentType, ogSize } from "@/components/og-card";
import { sizes } from "@/lib/catalog";
import { productSeo } from "@/lib/seo";

export const alt = productSeo.tshirt.summary;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogCard({
    title: "Koszulka z Twoim nadrukiem",
    line: `Rozmiary ${sizes[0]}-${sizes[sizes.length - 1]}, druk w Warszawie`,
    product: "tshirt",
  });
}
