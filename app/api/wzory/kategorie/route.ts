import { wzoryMessages } from "@/lib/wzory/labels";
import { wzorCategories } from "@/lib/wzory/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await wzorCategories();
    return Response.json({ items }, { headers: { "Cache-Control": "public, max-age=600" } });
  } catch (error) {
    console.error("[wzory] рубрики не собраны", error);
    return Response.json({ error: wzoryMessages.listError }, { status: 502 });
  }
}
