import { MerchFlow } from "@/components/merch-flow";
import { parseVariant } from "@/components/variants/kit";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { v } = await searchParams;
  return <MerchFlow variant={parseVariant(v)} />;
}
