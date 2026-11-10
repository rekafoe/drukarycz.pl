import { verifyCode } from "@/lib/store";
import { requireSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionId = await requireSessionId();
  let body: { email?: unknown; code?: unknown; name?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; code?: unknown; name?: unknown };
  } catch {
    return Response.json({ error: "Kod nie pasuje" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email : "";
  const code = typeof body.code === "string" ? body.code : "";
  const name = typeof body.name === "string" ? body.name : "";
  const result = await verifyCode(sessionId, email, code, name);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result.view);
}
