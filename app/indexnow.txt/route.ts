import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Файл ключа IndexNow для Bing. Сам сайт в IndexNow не стучится: адреса отправляет владелец (см. README). */
export function GET() {
  if (!site.indexNowKey) return new Response("Not found", { status: 404 });
  return new Response(site.indexNowKey, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
