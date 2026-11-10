import type { Metadata } from "next";
import { ProductEditorPage } from "@/components/editor-page";
import { editorSeo, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(editorSeo.mug);

export default function KubekMaketPage() {
  return <ProductEditorPage product="mug" />;
}
