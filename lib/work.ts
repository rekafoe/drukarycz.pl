import { quantities, shirtColors, sizes, type ProductId } from "@/lib/catalog";

export type Step = "doors" | "shop" | "editor" | "cart";
export type Finish = "none" | "matte" | "gloss";
export type CartFrom = "shop" | "editor";

export type WorkSnapshot = {
  step: Step;
  cartFrom: CartFrom;
  product: ProductId;
  zone: string;
  size: string;
  color: string;
  qty: string;
  finish: Finish;
  previewUrl: string | null;
  pages: Record<string, object>;
  placed: boolean;
};

export type PublicUser = {
  id: string;
  name: string;
  phone: string;
};

export type SessionView = {
  user: PublicUser | null;
  work: WorkSnapshot;
  designId: string | null;
  devCode: string | null;
};

const zoneIds: Record<ProductId, readonly string[]> = {
  tshirt: ["front", "back"],
  mug: ["wrap"],
};

/** Текст, который кнопка «Tekst» кладёт на пустой лист. */
export const defaultPrintText = "Twój nadruk";

/** Старые русские заготовки. Свой текст клиента не трогаем. */
const legacySeedText: Record<string, string> = {
  "Ваш принт": defaultPrintText,
};

function polishSeedPage(page: object): object {
  const record = asRecord(page);
  if (!record || !Array.isArray(record.objects)) return page;
  let changed = false;
  const objects = record.objects.map((item) => {
    const obj = asRecord(item);
    if (!obj || typeof obj.text !== "string") return item;
    const next = legacySeedText[obj.text.trim()];
    if (!next || next === obj.text) return item;
    changed = true;
    const { width: _width, height: _height, ...rest } = obj;
    return { ...rest, text: next };
  });
  if (!changed) return page;
  return { ...record, objects };
}

export function initialWork(): WorkSnapshot {
  return {
    step: "doors",
    cartFrom: "shop",
    product: "tshirt",
    zone: "front",
    size: "M",
    color: "#171614",
    qty: "1",
    finish: "none",
    previewUrl: null,
    pages: {},
    placed: false,
  };
}

export function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function workIsMeaningful(work: WorkSnapshot) {
  if (work.step !== "doors" || work.placed || work.previewUrl) return true;
  return Object.values(work.pages).some((page) => {
    if (!page || typeof page !== "object") return false;
    const objects = (page as { objects?: unknown }).objects;
    return Array.isArray(objects) && objects.length > 0;
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function sanitizeWork(input: unknown, allowPlaced: boolean): WorkSnapshot {
  const base = initialWork();
  const raw = asRecord(input);
  if (!raw) return base;

  const product: ProductId = raw.product === "mug" ? "mug" : "tshirt";
  const allowedZones = zoneIds[product];
  const zone = typeof raw.zone === "string" && allowedZones.includes(raw.zone) ? raw.zone : allowedZones[0];
  const step: Step =
    raw.step === "shop" || raw.step === "editor" || raw.step === "cart" || raw.step === "doors" ? raw.step : "doors";
  const cartFrom: CartFrom = raw.cartFrom === "editor" ? "editor" : "shop";
  const size = typeof raw.size === "string" && (sizes as readonly string[]).includes(raw.size) ? raw.size : "M";
  const qty = typeof raw.qty === "string" && (quantities as readonly string[]).includes(raw.qty) ? raw.qty : "1";
  const color =
    typeof raw.color === "string" && shirtColors.some((swatch) => swatch.value === raw.color) ? raw.color : "#171614";
  const finish: Finish = raw.finish === "matte" || raw.finish === "gloss" || raw.finish === "none" ? raw.finish : "none";

  let previewUrl: string | null = null;
  if (typeof raw.previewUrl === "string" && raw.previewUrl.startsWith("data:image/") && raw.previewUrl.length < 1_500_000) {
    previewUrl = raw.previewUrl;
  }

  const pages: Record<string, object> = {};
  const rawPages = asRecord(raw.pages);
  if (rawPages) {
    for (const key of ["front", "back", "wrap"]) {
      const page = rawPages[key];
      if (!page || typeof page !== "object" || Array.isArray(page)) continue;
      const encoded = JSON.stringify(page);
      if (encoded.length > 1_500_000) continue;
      pages[key] = polishSeedPage(page as object);
    }
  }

  return {
    step,
    cartFrom,
    product,
    zone,
    size,
    color,
    qty,
    finish,
    previewUrl,
    pages,
    placed: allowPlaced && raw.placed === true,
  };
}
