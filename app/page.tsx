import { MerchFlow } from "@/components/merch-flow";
import { parseAccent } from "@/components/variants/accents";
import { parseVariant } from "@/components/variants/kit";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { v, accent } = await searchParams;
  const picked = parseVariant(v);
  return (
    <MerchFlow
      variant={picked ?? "a"}
      compare={picked !== null}
      accent={parseAccent(accent)}
      accentPanel={accent !== undefined}
    />
  );
}
