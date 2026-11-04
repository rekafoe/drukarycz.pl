import type { Metadata } from "next";
import { ProductPage } from "@/components/product-page";
import { pageMetadata, productSeo } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(productSeo.tshirt);

export default function KoszulkaPage() {
  return <ProductPage product="tshirt" />;
}
