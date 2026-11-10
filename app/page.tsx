import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { MerchFlow } from "@/components/merch-flow";
import { editorPaths } from "@/lib/catalog";
import { peekCurrentSession } from "@/lib/session";
import { homeJsonLd, homeSeo, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(homeSeo);

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ v?: string | string[]; accent?: string | string[] }>;
}) {
  const initial = await peekCurrentSession();
  if (initial.work.step === "editor") redirect(editorPaths[initial.work.product]);
  const preview =
    process.env.NODE_ENV === "production"
      ? {}
      : await (await import("@/lib/visual-preview")).visualPreview(searchParams);
  return (
    <>
      <JsonLd data={homeJsonLd()} />
      <MerchFlow surface="home" initial={initial} {...preview} />
    </>
  );
}
