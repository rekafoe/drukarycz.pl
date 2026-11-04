import type { ProductId } from "@/lib/catalog";
import type { PrintAreaId } from "@/lib/work";

const zl = new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function formatZl(value: number) {
  return `${zl.format(value)} zł`;
}

/** Польское название из CRM появится позже, пока только код. */
export function wzorTitle(code: string) {
  return `Wzór nr ${code}`;
}

export function feeLabel(fee: number) {
  return fee > 0 ? `+${formatZl(fee)} za wzór` : "Wzór w cenie";
}

export function zonesLabel(product: ProductId, used: readonly PrintAreaId[]) {
  if (product === "mug") return "Dookoła kubka";
  const front = used.includes("front");
  const back = used.includes("back");
  if (front && back) return "Przód + tył";
  if (back) return "Tył";
  return "Przód";
}

export const wzoryMessages = {
  listError: "Nie udało się wczytać wzorów.",
  retry: "Spróbuj ponownie",
  emptyCategory: "W tej kategorii nie ma jeszcze wzorów.",
  notFitting: "Ten wzór nie pasuje do tego produktu.",
  notFound: "Nie ma takiego wzoru.",
} as const;
