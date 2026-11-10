import { readFile } from "fs/promises";
import path from "path";
import type { ProductId } from "@/lib/catalog";
import { crmProductLink, type CrmProductLink } from "@/lib/wzory/schema";
import { productSlugs, type WzorProductSlug } from "@/lib/wzory/types";

const envMap: Record<
  WzorProductSlug,
  { productId: string; typeId: string; blank: string }
> = {
  koszulka: {
    productId: "CRM_KOSZULKA_PRODUCT_ID",
    typeId: "CRM_KOSZULKA_TYPE_ID",
    blank: "CRM_KOSZULKA_BLANK_TEMPLATE_ID",
  },
  kubek: {
    productId: "CRM_KUBEK_PRODUCT_ID",
    typeId: "CRM_KUBEK_TYPE_ID",
    blank: "CRM_KUBEK_BLANK_TEMPLATE_ID",
  },
};

function envInt(name: string): number | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

async function fileLinks(): Promise<Record<string, unknown>> {
  try {
    const text = await readFile(path.join(process.cwd(), "fixtures", "wzory", "produkty.json"), "utf8");
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Связь двери сайта с товаром CRM. Не секрет: те же id, что в fixtures/wzory/produkty.json. */
export async function siteProductLink(slug: WzorProductSlug): Promise<CrmProductLink | null> {
  const names = envMap[slug];
  const fromFile = crmProductLink.safeParse((await fileLinks())[slug]);
  const productId = envInt(names.productId) ?? (fromFile.success ? fromFile.data.productId : undefined);
  const typeId = envInt(names.typeId) ?? (fromFile.success ? fromFile.data.typeId : undefined);
  if (!productId || !typeId) return null;
  const blank = envInt(names.blank);
  return {
    productId,
    typeId,
    souvenirBlankTemplateId: blank ?? (fromFile.success ? fromFile.data.souvenirBlankTemplateId : null),
  };
}

export function productSlugOf(product: ProductId): WzorProductSlug {
  return productSlugs[product];
}
