import type { ProductId } from "@/lib/catalog";
import type { PrintAreaId } from "@/lib/work";

export type WzorProductSlug = "koszulka" | "kubek";

export const productSlugs: Record<ProductId, WzorProductSlug> = { tshirt: "koszulka", mug: "kubek" };

export function productFromSlug(value: unknown): ProductId | null {
  if (value === "koszulka") return "tshirt";
  if (value === "kubek") return "mug";
  return null;
}

export type WzorFont = { family: string; url: string };

export type WzorCard = {
  id: number;
  code: string;
  product: ProductId;
  categoryId: number | null;
  /** Плата за дизайн в злотых, один раз на позицию. */
  usageFee: number;
  usedPrintAreaIds: PrintAreaId[];
  /** Прозрачные PNG зон со своего сервера, для мокапа. */
  previews: Partial<Record<PrintAreaId, string>>;
  /** site_preview_url → preview_url, уже со своего сервера. */
  image: string | null;
};

export type WzorDetail = WzorCard & {
  /** Fabric JSON по зонам, в единицах холста редактора сайта. */
  pages: Partial<Record<PrintAreaId, { version: string; objects: Record<string, unknown>[] }>>;
  fonts: WzorFont[];
  /** false, когда шрифты не подтверждены: только «Zmień w edytorze». */
  asIs: boolean;
  warnings: string[];
  updatedAt: string;
};

export type WzorCategory = { id: number; name: string };

export type WzorRejectReason =
  | "schema"
  | "inactive"
  | "blank"
  | "not_souvenir"
  | "no_design"
  | "product"
  | "zone"
  | "empty"
  | "asset";

export type WzorResult =
  | { ok: true; wzor: WzorDetail }
  | { ok: false; reason: WzorRejectReason; detail: string; code: string | null };
