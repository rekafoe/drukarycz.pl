/**
 * Адрес CRM и ключ заказа. Браузер их не видит: читает только сервер сайта.
 * Пустые значения — нормальный локальный режим, не ошибка запуска.
 */
export const CRM_URL_ENV = "CRM_URL";
export const CRM_API_URL_ENV = "CRM_API_URL";
export const WEBSITE_ORDER_API_KEY_ENV = "WEBSITE_ORDER_API_KEY";
export const DESIGNS_SOURCE_ENV = "DESIGNS_SOURCE";

const FETCH_MS = 8_000;

export function crmFetchTimeoutMs() {
  return FETCH_MS;
}

function rawCrmUrl() {
  const value = (process.env.CRM_URL || process.env.CRM_API_URL || "").trim();
  return value.replace(/\/+$/, "");
}

/** Origin CRM без хвоста `/api`: картинки склеиваются с ним. */
export function crmOrigin(): string {
  return rawCrmUrl().replace(/\/api$/i, "");
}

/** База `/api` CRM. Пусто, если адрес не задан. */
export function crmApiBase(): string {
  const origin = crmOrigin();
  return origin ? `${origin}/api` : "";
}

export function isCrmConfigured() {
  return crmOrigin().length > 0;
}

export function websiteOrderApiKey() {
  return (process.env.WEBSITE_ORDER_API_KEY ?? "").trim();
}

export function hasWebsiteOrderApiKey() {
  return websiteOrderApiKey().length > 0;
}

/** Черновики идут в живую CRM только когда есть и адрес, и ключ сайта. */
export function canUseCrmDrafts() {
  return isCrmConfigured() && hasWebsiteOrderApiKey();
}

export function designsSourceKind(): "fixtures" | "crm" {
  return process.env.DESIGNS_SOURCE === "crm" && isCrmConfigured() ? "crm" : "fixtures";
}

export function buildCrmUrl(path: string): string | null {
  const origin = crmOrigin();
  if (!origin) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized.startsWith("/api/") || normalized === "/api") return `${origin}${normalized}`;
  return `${origin}/api${normalized}`;
}
