import { quantities, shirtColors, sizes, type ProductId } from "@/lib/catalog";

export type Step = "doors" | "shop" | "editor" | "cart";
export type Finish = "none" | "matte" | "gloss";
export type CartFrom = "shop" | "editor";

export type PrintAreaId = "front" | "back" | "wrap";

export type PrintFileMeta = {
  bytes: number;
  savedAt: string;
};

export type PrintFiles = Partial<Record<PrintAreaId, PrintFileMeta>>;

export type QualityIssue = {
  code: "low_dpi" | "out_of_bounds" | "small_text";
  severity: "warning" | "error";
  areaId: string;
  message: string;
};

export type OrderDetails = {
  email: string;
  street: string;
  postalCode: string;
  city: string;
  nip: string;
  acceptTerms: boolean;
  acceptCustom: boolean;
  marketing: boolean;
  consentAt: string;
};

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
  quality: QualityIssue[];
  printFiles: PrintFiles;
  order: OrderDetails;
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

export function emptyOrder(): OrderDetails {
  return {
    email: "",
    street: "",
    postalCode: "",
    city: "",
    nip: "",
    acceptTerms: false,
    acceptCustom: false,
    marketing: false,
    consentAt: "",
  };
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
    quality: [],
    printFiles: {},
    order: emptyOrder(),
    placed: false,
  };
}

export function samePages(a: Record<string, object>, b: Record<string, object>) {
  return (["front", "back", "wrap"] as const).every((key) => JSON.stringify(a[key] ?? null) === JSON.stringify(b[key] ?? null));
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

function clip(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const postalPattern = /^\d{2}-\d{3}$/;

function sanitizeOrder(raw: unknown, previous: WorkSnapshot | null | undefined, wantPlaced: boolean, allowPlaced: boolean) {
  const source = asRecord(raw);
  const email = clip(source?.email, 120);
  const street = clip(source?.street, 120);
  const postalCode = clip(source?.postalCode, 6);
  const city = clip(source?.city, 120);
  const nipRaw = clip(source?.nip, 20);
  const nipCompact = nipRaw.replace(/[\s-]/g, "");
  const nipOk = nipCompact === "" || /^\d{10}$/.test(nipCompact);
  const nip = nipOk ? nipCompact : "";
  const acceptTerms = source?.acceptTerms === true;
  const acceptCustom = source?.acceptCustom === true;
  const marketing = source?.marketing === true;
  const complete =
    emailPattern.test(email) &&
    street.length > 2 &&
    postalPattern.test(postalCode) &&
    city.length > 1 &&
    acceptTerms &&
    acceptCustom &&
    nipOk;
  const placed = allowPlaced && wantPlaced && complete;
  let consentAt = "";
  if (placed) {
    const prevAt = previous?.order?.consentAt;
    const keep = Boolean(previous?.placed && typeof prevAt === "string" && prevAt && !Number.isNaN(Date.parse(prevAt)));
    consentAt = keep && typeof prevAt === "string" ? prevAt : new Date().toISOString();
  }
  const order: OrderDetails = {
    email,
    street,
    postalCode,
    city,
    nip,
    acceptTerms,
    acceptCustom,
    marketing,
    consentAt,
  };
  return { order, placed };
}

function sanitizeQuality(raw: unknown): QualityIssue[] {
  if (!Array.isArray(raw)) return [];
  const issues: QualityIssue[] = [];
  for (const item of raw) {
    const record = asRecord(item);
    if (!record) continue;
    const code = record.code;
    if (code !== "low_dpi" && code !== "out_of_bounds" && code !== "small_text") continue;
    const areaId = record.areaId === "front" || record.areaId === "back" || record.areaId === "wrap" ? record.areaId : "";
    if (!areaId) continue;
    const message = clip(record.message, 180);
    if (!message) continue;
    issues.push({
      code,
      severity: code === "out_of_bounds" ? "error" : "warning",
      areaId,
      message,
    });
    if (issues.length >= 8) break;
  }
  return issues;
}

export function sanitizeWork(input: unknown, allowPlaced: boolean, previous?: WorkSnapshot | null): WorkSnapshot {
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

  const orderState = sanitizeOrder(raw.order, previous, raw.placed === true, allowPlaced);

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
    quality: sanitizeQuality(raw.quality),
    printFiles: {},
    order: orderState.order,
    placed: orderState.placed,
  };
}
