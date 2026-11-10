import { proxyCrmMedia } from "@/lib/crm/media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ path: string[] }> };

/** Картинки и шрифты CRM. Браузер ходит только сюда, не на адрес CRM. */
export async function GET(request: Request, context: RouteContext) {
  const parts = (await context.params).path ?? [];
  const search = new URL(request.url).search.slice(1);
  const result = await proxyCrmMedia(parts, search);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return new Response(new Uint8Array(result.body), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
