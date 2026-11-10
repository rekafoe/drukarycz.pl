import { requestCode } from "@/lib/store";
import { requireSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionId = await requireSessionId();
  let body: { email?: unknown };
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return Response.json({ error: "Podaj e-mail" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email : "";
  const result = await requestCode(sessionId, email);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}
