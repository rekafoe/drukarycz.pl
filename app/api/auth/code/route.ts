import { requestCode } from "@/lib/store";
import { requireSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionId = await requireSessionId();
  let body: { phone?: unknown };
  try {
    body = (await request.json()) as { phone?: unknown };
  } catch {
    return Response.json({ error: "Podaj telefon" }, { status: 400 });
  }
  const phone = typeof body.phone === "string" ? body.phone : "";
  const result = await requestCode(sessionId, phone);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}
