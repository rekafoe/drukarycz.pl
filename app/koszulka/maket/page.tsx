import type { Metadata } from "next";
import { ProductEditorPage } from "@/components/editor-page";
import { editorSeo, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(editorSeo.tshirt);

export default function KoszulkaMaketPage() {
  return <ProductEditorPage product="tshirt" />;
}
