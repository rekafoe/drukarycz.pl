import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { MerchFlow } from "@/components/merch-flow";
import { peekCurrentSession } from "@/lib/session";
import { homeJsonLd, homeSeo, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(homeSeo);

export default async function Home() {
  const initial = await peekCurrentSession();
  return (
    <>
      <JsonLd data={homeJsonLd()} />
      <MerchFlow initial={initial} />
    </>
  );
}
