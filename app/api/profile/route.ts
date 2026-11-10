import { updateProfile } from "@/lib/store";
import { requireSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionId = await requireSessionId();
  let body: { name?: unknown; phone?: unknown };
  try {
    body = (await request.json()) as { name?: unknown; phone?: unknown };
  } catch {
    return Response.json({ error: "Napisz, jak się do Ciebie zwracać" }, { status: 400 });
  }
  const result = await updateProfile(sessionId, {
    name: typeof body.name === "string" ? body.name : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
  });
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result.view);
}
