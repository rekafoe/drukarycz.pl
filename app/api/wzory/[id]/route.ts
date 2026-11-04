import { wzoryMessages } from "@/lib/wzory/labels";
import { getWzor } from "@/lib/wzory/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return Response.json({ error: wzoryMessages.notFound }, { status: 404 });
  try {
    const result = await getWzor(id);
    if (!result) return Response.json({ error: wzoryMessages.notFound }, { status: 404 });
    if (!result.ok) return Response.json({ error: wzoryMessages.notFitting, reason: result.reason }, { status: 422 });
    return Response.json({ wzor: result.wzor }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (error) {
    console.error("[wzory] шаблон не собран", error);
    return Response.json({ error: wzoryMessages.listError }, { status: 502 });
  }
}
