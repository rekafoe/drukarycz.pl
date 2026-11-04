import { readFile } from "fs/promises";
import path from "path";
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

/** Пустая заглушка до подключения CRM: те же формы, без данных. Запросы в CRM пойдут только с этого сервера. */
const crmSource: WzorySource = {
  kind: "crm",
  cacheMs: 5 * 60_000,
  assets: { mode: "crm", origin: process.env.CRM_URL ?? "" },
  async product() {
    return null;
  },
  async list() {
    return [];
  },
  async detail() {
    return null;
  },
  async categories() {
    return [];
  },
};

export function designsSource(): WzorySource {
  return process.env.DESIGNS_SOURCE === "crm" ? crmSource : fixturesSource;
}
