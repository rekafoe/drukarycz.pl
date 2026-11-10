import { crmOrigin, isCrmConfigured } from "@/lib/crm/config";

const MAX_BYTES = 8_000_000;

const allowedPath = [
  /^\/api\/uploads\/[A-Za-z0-9._/-]+\.(png|jpe?g|webp|svg|gif|woff2?|ttf|otf)$/i,
  /^\/api\/design-templates\/public\/\d+\/assets\/\d+\/(content|thumb)\/?$/i,
  /^\/api\/design-fonts\/public\/\d+\/content\/?$/i,
  /^\/storage\/[A-Za-z0-9._/-]+\.(png|jpe?g|webp|svg|gif|woff2?|ttf|otf)$/i,
];

const allowedType = /^(image\/|font\/|application\/font|application\/octet-stream)/i;

export function crmMediaPath(parts: string[]): string | null {
  if (parts.length === 0 || parts.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) {
    return null;
  }
  const pathname = `/${parts.join("/")}`;
  if (pathname.includes("//") || pathname.includes("\\") || pathname.includes(":")) return null;
  return allowedPath.some((rule) => rule.test(pathname)) ? pathname : null;
}

export function crmMediaSearch(raw: string): string {
  if (!raw || raw.length > 180) return "";
  return /^[A-Za-z0-9_=&%.-]+$/.test(raw) ? raw : "";
}

export type MediaProxyResult =
  | { ok: true; body: Buffer; contentType: string }
  | { ok: false; status: number; error: string };

/** Картинки и шрифты CRM только через этот сервер. Адрес CRM из env, не из запроса. */
export async function proxyCrmMedia(parts: string[], search: string): Promise<MediaProxyResult> {
  if (!isCrmConfigured()) return { ok: false, status: 404, error: "CRM niepołączone" };
  const pathname = crmMediaPath(parts);
  if (!pathname) return { ok: false, status: 400, error: "Zły adres pliku" };
  const origin = crmOrigin();
  const query = crmMediaSearch(search.startsWith("?") ? search.slice(1) : search);
  const url = `${origin}${pathname}${query ? `?${query}` : ""}`;
  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: "image/*,font/*,*/*;q=0.1" },
    });
  } catch {
    return { ok: false, status: 502, error: "CRM nie odpowiada" };
  }
  if (!response.ok) return { ok: false, status: response.status === 404 ? 404 : 502, error: "Nie wczytano pliku" };
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType && !allowedType.test(contentType)) {
    return { ok: false, status: 502, error: "To nie jest obraz ani font" };
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    return { ok: false, status: 502, error: "Plik pusty albo za duży" };
  }
  return { ok: true, body: bytes, contentType: contentType || "application/octet-stream" };
}
