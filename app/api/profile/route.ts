import { renameUser } from "@/lib/store";
import { requireSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionId = await requireSessionId();
  let body: { name?: unknown };
  try {
    body = (await request.json()) as { name?: unknown };
  } catch {
    return Response.json({ error: "Napisz, jak się do Ciebie zwracać" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name : "";
  const result = await renameUser(sessionId, name);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result.view);
}
