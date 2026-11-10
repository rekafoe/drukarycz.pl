import {
  buildCrmUrl,
  canUseCrmDrafts,
  crmFetchTimeoutMs,
  websiteOrderApiKey,
} from "@/lib/crm/config";

export type CrmFetchInit = RequestInit & {
  /** Ключ `WEBSITE_ORDER_API_KEY` — только для /public-editor и заказа. Публичные шаблоны и медиа без ключа. */
  apiKey?: boolean;
};

export class CrmUnreachableError extends Error {
  constructor(message = "CRM недоступна") {
    super(message);
    this.name = "CrmUnreachableError";
  }
}

/** Серверный запрос в CRM. Чужой URL из запроса клиента сюда не попадает. */
export async function fetchCrm(path: string, init: CrmFetchInit = {}): Promise<Response> {
  const url = buildCrmUrl(path);
  if (!url) throw new CrmUnreachableError("CRM_URL не задан");
  const headers = new Headers(init.headers);
  if (init.apiKey) {
    if (!canUseCrmDrafts()) throw new CrmUnreachableError("WEBSITE_ORDER_API_KEY не задан");
    headers.set("X-API-Key", websiteOrderApiKey());
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const signal = init.signal ?? AbortSignal.timeout(crmFetchTimeoutMs());
  try {
    return await fetch(url, { ...init, headers, signal, redirect: "error" });
  } catch (error) {
    if (error instanceof CrmUnreachableError) throw error;
    throw new CrmUnreachableError(error instanceof Error ? error.message : "CRM недоступна");
  }
}

export async function readCrmJson<T = unknown>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`CRM ответ не JSON (${response.status})`);
  }
}
