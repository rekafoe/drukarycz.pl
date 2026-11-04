import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { MerchFlow } from "@/components/merch-flow";
import { parseAccent } from "@/components/variants/accents";
import { parseVariant } from "@/components/variants/kit";
import { peekCurrentSession } from "@/lib/session";
import { homeJsonLd, homeSeo, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(homeSeo);

export default async function Home({ searchParams }: PageProps<"/">) {
  const initial = await peekCurrentSession();
  const preview = process.env.NODE_ENV === "production" ? {} : await visualPreview(searchParams);
  return (
    <>
      <JsonLd data={homeJsonLd()} />
      <MerchFlow initial={initial} {...preview} />
    </>
  );
}

async function visualPreview(searchParams: PageProps<"/">["searchParams"]) {
  const { v, accent } = await searchParams;
  const picked = parseVariant(v);
  return {
    variant: picked ?? "a",
    compare: picked !== null,
    accent: parseAccent(accent),
    accentPanel: accent !== undefined,
  } as const;
}
