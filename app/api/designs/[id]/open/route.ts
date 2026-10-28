import { openOwnDesign } from "@/lib/store";
import { requireSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const sessionId = await requireSessionId();
  const { id } = await context.params;
  const opened = await openOwnDesign(sessionId, id);
  if (!opened) return Response.json({ error: "Projekt się nie otwiera" }, { status: 404 });
  return Response.json({ ok: true });
}
