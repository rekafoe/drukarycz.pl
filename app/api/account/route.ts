import { deleteAccount } from "@/lib/store";
import { requireSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE() {
  const sessionId = await requireSessionId();
  const result = await deleteAccount(sessionId);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result.view);
}
