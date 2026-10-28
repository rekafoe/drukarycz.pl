import { verifyCode } from "@/lib/store";
import { requireSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionId = await requireSessionId();
  let body: { phone?: unknown; code?: unknown; name?: unknown };
  try {
    body = (await request.json()) as { phone?: unknown; code?: unknown; name?: unknown };
  } catch {
    return Response.json({ error: "Код не подошёл" }, { status: 400 });
  }
  const phone = typeof body.phone === "string" ? body.phone : "";
  const code = typeof body.code === "string" ? body.code : "";
  const name = typeof body.name === "string" ? body.name : "";
  const result = await verifyCode(sessionId, phone, code, name);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result.view);
}
