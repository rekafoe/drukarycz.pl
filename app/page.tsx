import { MerchFlow } from "@/components/merch-flow";
import { parseVariant } from "@/components/variants/kit";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { v } = await searchParams;
  const picked = parseVariant(v);
  return <MerchFlow variant={picked ?? "a"} compare={picked !== null} />;
}
