import type { Metadata } from "next";
import { ProductPage } from "@/components/product-page";
import { pageMetadata, productSeo } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(productSeo.mug);

export default function KubekPage() {
  return <ProductPage product="mug" />;
}
