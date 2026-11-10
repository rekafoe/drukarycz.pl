import { ogCard, ogContentType, ogSize } from "@/components/og-card";
import { getLanding } from "@/lib/landings";

const landing = getLanding("warszawa");

export const alt = landing.description;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogCard({ title: landing.ogTitle, line: landing.ogLine });
}
