import { logoutSession } from "@/lib/store";
import { requireSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const sessionId = await requireSessionId();
  const view = await logoutSession(sessionId);
  if (!view) return Response.json({ error: "Nie znaleziono sesji" }, { status: 401 });
  return Response.json(view);
}
