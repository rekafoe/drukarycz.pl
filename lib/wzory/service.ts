import { statSync } from "fs";
import path from "path";
import { catalog, type ProductId } from "@/lib/catalog";
import type { PrintAreaId } from "@/lib/work";
import { normalizeWzor } from "@/lib/wzory/normalize";
import { crmCategory, crmListItem, crmProductLink, type CrmListItem } from "@/lib/wzory/schema";
import { designsSource, type WzorySource } from "@/lib/wzory/source";
import { productSlugs, type WzorCard, type WzorCategory, type WzorDetail, type WzorResult } from "@/lib/wzory/types";

type ProductState = {
  items: CrmListItem[];
  results: Map<number, WzorResult>;
};

const cache = new Map<string, { until: number; value: Promise<unknown> }>();

function cached<T>(source: WzorySource, key: string, ms: number, load: () => Promise<T>): Promise<T> {
  if (ms <= 0) return load();
  const full = `${source.kind}:${key}`;
  const hit = cache.get(full);
  if (hit && hit.until > Date.now()) return hit.value as Promise<T>;
  const value = load();
  cache.set(full, { until: Date.now() + ms, value });
  value.catch(() => cache.delete(full));
  return value;
}

// Маршруты Next держат свои копии модуля, поэтому общий набор лежит в globalThis.
const logged: Set<string> = ((globalThis as { __wzoryLogged?: Set<string> }).__wzoryLogged ??= new Set());

function logRejected(id: number, result: Extract<WzorResult, { ok: false }>) {
  const key = `${id}:${result.reason}:${result.detail}`;
  if (logged.has(key)) return;
  logged.add(key);
  console.warn(`[wzory] шаблон ${id} (${result.code ?? "без кода"}) отброшен: ${result.reason} — ${result.detail}`);
}

const previewDir = path.join(process.cwd(), "public", "wzory", "preview");

function withPreviews(wzor: WzorDetail): WzorDetail {
  const previews: WzorDetail["previews"] = {};
  for (const area of wzor.usedPrintAreaIds) {
    const name = `${wzor.id}-${area}.png`;
    try {
      const stat = statSync(path.join(previewDir, name));
      previews[area as PrintAreaId] = `/wzory/preview/${name}?v=${Math.round(stat.mtimeMs).toString(36)}`;
    } catch {
      // нет своего превью — карточка возьмёт image или заглушку
    }
  }
  return { ...wzor, previews };
}

function loadProduct(source: WzorySource, product: ProductId): Promise<ProductState> {
  return cached(source, `product:${product}`, source.cacheMs, async () => {
    const link = crmProductLink.safeParse(await source.product(productSlugs[product]));
    if (!link.success) return { items: [], results: new Map() };
    const raw = await source.list(productSlugs[product], link.data);
    if (!Array.isArray(raw)) throw new Error("список шаблонов не массив");
    const items: CrmListItem[] = [];
    for (const entry of raw) {
      const parsed = crmListItem.safeParse(entry);
      if (parsed.success) items.push(parsed.data);
      else console.warn(`[wzory] строка списка ${productSlugs[product]} не по схеме: ${parsed.error.issues[0]?.message ?? ""}`);
    }
    const results = new Map<number, WzorResult>();
    await Promise.all(
      items.map(async (item) => {
        const detail = await source.detail(item.id);
        const result: WzorResult = detail
          ? normalizeWzor(detail, { product, link: link.data, assets: source.assets })
          : { ok: false, reason: "schema", detail: "нет ответа /public/:id", code: item.design_code };
        if (result.ok) results.set(item.id, { ok: true, wzor: withPreviews(result.wzor) });
        else {
          results.set(item.id, result);
          logRejected(item.id, result);
        }
      }),
    );
    return { items, results };
  });
}

export function toCard(wzor: WzorDetail): WzorCard {
  return {
    id: wzor.id,
    code: wzor.code,
    product: wzor.product,
    categoryId: wzor.categoryId,
    usageFee: wzor.usageFee,
    usedPrintAreaIds: wzor.usedPrintAreaIds,
    previews: wzor.previews,
    image: wzor.image,
  };
}

export async function listWzory(product: ProductId): Promise<WzorCard[]> {
  const state = await loadProduct(designsSource(), product);
  const cards: WzorCard[] = [];
  for (const item of state.items) {
    const result = state.results.get(item.id);
    if (result?.ok) cards.push(toCard(result.wzor));
  }
  return cards;
}

/** Шаблон ищется только среди привязанных к нашим вещам: так не всплывёт чужой каталог CRM. */
export async function getWzor(id: number): Promise<WzorResult | null> {
  const source = designsSource();
  for (const product of catalog.map((item) => item.id)) {
    const result = (await loadProduct(source, product)).results.get(id);
    if (result) return result;
  }
  return null;
}

export async function findWzorByCode(code: string): Promise<WzorResult | null> {
  const source = designsSource();
  for (const product of catalog.map((item) => item.id)) {
    const state = await loadProduct(source, product);
    const item = state.items.find((entry) => entry.design_code === code);
    if (item) return state.results.get(item.id) ?? null;
  }
  return null;
}

export async function wzorCategories(): Promise<WzorCategory[]> {
  const source = designsSource();
  return cached(source, "categories", source.cacheMs * 12, async () => {
    const raw = await source.categories();
    if (!Array.isArray(raw)) throw new Error("рубрики не массив");
    return raw
      .map((entry) => crmCategory.safeParse(entry))
      .filter((parsed) => parsed.success)
      .map((parsed) => parsed.data)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((item) => ({ id: item.id, name: item.name }));
  });
}
