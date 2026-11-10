import { readFile } from "fs/promises";
import path from "path";
import { crmOrigin, designsSourceKind, isCrmConfigured } from "@/lib/crm/config";
import { CrmUnreachableError, fetchCrm, readCrmJson } from "@/lib/crm/fetch";
import { siteProductLink } from "@/lib/crm/products";
import { localAssets, type AssetPolicy } from "@/lib/wzory/normalize";
import type { WzorProductSlug } from "@/lib/wzory/types";

/**
 * Источник дизайнов. Отдаёт сырые ответы той же формы, что CRM2026
 * `GET /api/design-templates/public*`, схему и нормализацию сервис делает сам.
 */
export type WzorySource = {
  kind: "fixtures" | "crm";
  cacheMs: number;
  assets: AssetPolicy;
  /** Связь вещи сайта с товаром CRM: `{ productId, typeId, souvenirBlankTemplateId }`. */
  product(slug: WzorProductSlug): Promise<unknown>;
  list(slug: WzorProductSlug, link: { productId: number; typeId: number }): Promise<unknown>;
  detail(id: number): Promise<unknown>;
  categories(): Promise<unknown>;
};

const fixturesDir = path.join(process.cwd(), "fixtures", "wzory");

async function readFixture(...parts: string[]) {
  try {
    return JSON.parse(await readFile(path.join(fixturesDir, ...parts), "utf8")) as unknown;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

const fixturesSource: WzorySource = {
  kind: "fixtures",
  cacheMs: 0,
  assets: localAssets,
  async product(slug) {
    const all = (await readFixture("produkty.json")) as Record<string, unknown> | null;
    return all?.[slug] ?? null;
  },
  list(slug) {
    return readFixture(`list-${slug}.json`);
  },
  detail(id) {
    if (!Number.isSafeInteger(id) || id <= 0) return Promise.resolve(null);
    return readFixture("detail", `${id}.json`);
  },
  categories() {
    return readFixture("kategorie.json");
  },
};

async function crmPublic(path: string): Promise<{ status: "ok"; data: unknown } | { status: "miss" } | { status: "down" }> {
  if (!isCrmConfigured()) return { status: "down" };
  try {
    const response = await fetchCrm(path, { apiKey: false });
    if (response.status === 404) return { status: "miss" };
    if (!response.ok) return { status: "down" };
    return { status: "ok", data: await readCrmJson(response) };
  } catch (error) {
    if (error instanceof CrmUnreachableError) return { status: "down" };
    return { status: "down" };
  }
}

function warnCrmDown(what: string) {
  console.warn(`[wzory] CRM недоступна (${what}), берём fixtures`);
}

/**
 * Живая CRM, когда задан `CRM_URL`. Если CRM не отвечает — те же fixtures, чтобы сайт открывался без секретов.
 * Админка каталога на сайте не появляется: шаблоны по-прежнему заводятся в CRM.
 */
function liveCrmSource(): WzorySource {
  return {
    kind: "crm",
    cacheMs: 5 * 60_000,
    assets: { mode: "crm", origin: crmOrigin() },
    product(slug) {
      return siteProductLink(slug);
    },
    async list(slug, link) {
      const result = await crmPublic(
        `/api/design-templates/public?productId=${encodeURIComponent(String(link.productId))}&typeId=${encodeURIComponent(String(link.typeId))}`,
      );
      if (result.status === "ok") return result.data;
      if (result.status === "miss") return [];
      warnCrmDown(`список ${slug}`);
      return fixturesSource.list(slug, link);
    },
    async detail(id) {
      if (!Number.isSafeInteger(id) || id <= 0) return null;
      const result = await crmPublic(`/api/design-templates/public/${id}`);
      if (result.status === "ok") return result.data;
      if (result.status === "miss") return null;
      warnCrmDown(`шаблон ${id}`);
      return fixturesSource.detail(id);
    },
    async categories() {
      const result = await crmPublic("/api/design-templates/public/categories");
      if (result.status === "ok") return result.data;
      if (result.status === "miss") return [];
      warnCrmDown("рубрики");
      return fixturesSource.categories();
    },
  };
}

export function designsSource(): WzorySource {
  return designsSourceKind() === "crm" ? liveCrmSource() : fixturesSource;
}
