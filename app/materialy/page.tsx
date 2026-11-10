import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { ProductLanding } from "@/components/product-landing";
import { getLanding } from "@/lib/landings";
import { landingJsonLd, pageMetadata } from "@/lib/seo";

const landing = getLanding("materialy");

export const metadata: Metadata = pageMetadata(landing);

export default function MaterialyPage() {
  return (
    <>
      <JsonLd data={landingJsonLd("materialy")} />
      <ProductLanding id="materialy" />
    </>
  );
}
