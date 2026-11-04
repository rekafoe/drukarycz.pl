import { parseAccent } from "@/components/variants/accents";
import { parseVariant } from "@/components/variants/kit";

/** Только `next dev`: ?v= и ?accent= не попадают в production-сборку страницы. */
export async function visualPreview(searchParams: Promise<{ v?: string | string[]; accent?: string | string[] }>) {
  const { v, accent } = await searchParams;
  const picked = parseVariant(v);
  return {
    variant: picked ?? "a",
    compare: picked !== null,
    accent: parseAccent(accent),
    accentPanel: accent !== undefined,
  } as const;
}
