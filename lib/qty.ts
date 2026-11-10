import { seller } from "@/lib/seller";
import { formatZl } from "@/lib/wzory/labels";

/** Dolny próg nakładu: jedna sztuka. */
export const qtyMin = 1;

/** Górny próg pola — nie limit oferty, tylko żeby liczba została liczbą. */
export const qtyMax = 9999;

/** Całkowita liczba sztuk ≥ 1. Cokolwiek innego schodzi do 1. */
export function parseQty(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.trunc(value);
    if (n >= qtyMin) return Math.min(n, qtyMax);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed);
      if (n >= qtyMin) return Math.min(n, qtyMax);
    }
  }
  return qtyMin;
}

export function qtyString(value: unknown): string {
  return String(parseQty(value));
}

/** «od 5 zł × N» — cena rzeczy idzie za faktycznym nakładem. */
export function goodsPriceLabel(qty: unknown): string {
  return `${seller.priceFrom} × ${parseQty(qty)}`;
}

/** To samo plus opłata za wzór raz na pozycję, jeśli jest. */
export function linePriceLabel(qty: unknown, usageFee = 0): string {
  const goods = goodsPriceLabel(qty);
  if (usageFee > 0) return `${goods} + ${formatZl(usageFee)} za wzór`;
  return goods;
}
