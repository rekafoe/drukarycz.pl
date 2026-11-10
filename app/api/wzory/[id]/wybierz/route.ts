import { persistEditorDraft } from "@/lib/crm/drafts";
import { requireSessionId } from "@/lib/session";
import { replaceWork } from "@/lib/store";
import { workWithWzor, type ChoiceMode } from "@/lib/wzory/choose";
import { wzoryMessages } from "@/lib/wzory/labels";
import { getWzor } from "@/lib/wzory/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Копирует шаблон в проект сессии: «Zamów bez zmian» → лавка, «Zmień w edytorze» → редактор. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const id = Number((await context.params).id);
  let mode: ChoiceMode;
  try {
    const body = (await request.json()) as { mode?: unknown };
    if (body.mode !== "edit" && body.mode !== "as-is") throw new Error("mode");
    mode = body.mode;
  } catch {
    return Response.json({ error: "Nie odczytano wyboru" }, { status: 400 });
  }
  if (!Number.isSafeInteger(id) || id <= 0) return Response.json({ error: wzoryMessages.notFound }, { status: 404 });
  const result = await getWzor(id);
  if (!result) return Response.json({ error: wzoryMessages.notFound }, { status: 404 });
  if (!result.ok) return Response.json({ error: wzoryMessages.notFitting, reason: result.reason }, { status: 422 });
  if (mode === "as-is" && !result.wzor.asIs) {
    return Response.json({ error: "Ten wzór trzeba najpierw otworzyć w edytorze." }, { status: 409 });
  }
  const sessionId = await requireSessionId();
  const view = await replaceWork(sessionId, (work) => workWithWzor(work, result.wzor, mode));
  if (!view) return Response.json({ error: "Nie znaleziono sesji" }, { status: 401 });
  const draft = await persistEditorDraft({ guestToken: sessionId, work: view.work });
  const saved = await replaceWork(sessionId, (work) => ({ ...work, editorDraftToken: draft.token }));
  return Response.json({ ok: true, step: saved?.work.step ?? view.work.step, editorDraftToken: draft.token });
}
