import { ogCard, ogContentType, ogSize } from "@/components/og-card";
import { seller } from "@/lib/seller";

export const alt = `${seller.brand} — koszulki i kubki z własnym nadrukiem`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogCard({ title: "Koszulki i kubki z Twoim projektem", line: `Edytor online, model 3D, druk ${seller.cityIn}` });
}
