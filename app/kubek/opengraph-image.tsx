import { ogCard, ogContentType, ogSize } from "@/components/og-card";
import { seller } from "@/lib/seller";
import { productSeo } from "@/lib/seo";

export const alt = productSeo.mug.summary;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogCard({ title: "Kubek 330 ml z Twoim nadrukiem", line: `Nadruk na obwodzie, druk ${seller.cityIn}`, product: "mug" });
}
