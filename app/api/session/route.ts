import { saveWork } from "@/lib/store";
import { currentSession, requireSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const view = await currentSession();
  return Response.json(view);
}

export async function POST(request: Request) {
  const sessionId = await requireSessionId();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Nie odczytano projektu" }, { status: 400 });
  }
  const view = await saveWork(sessionId, body);
  if (!view) return Response.json({ error: "Nie znaleziono sesji" }, { status: 401 });
  return Response.json(view);
}
