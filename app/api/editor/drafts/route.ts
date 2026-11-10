import { persistEditorDraft, shouldPersistDraft } from "@/lib/crm/drafts";
import { currentSession, requireSessionId } from "@/lib/session";
import { replaceWork, saveWork } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/editor/drafts → CRM `/api/public-editor/drafts` (ключ только здесь).
 * Без CRM или без ключа — локальный `mock_` токен, сайт не падает.
 */
export async function POST(request: Request) {
  const sessionId = await requireSessionId();
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  let work = (await currentSession()).work;
  if (body && typeof body === "object") {
    const view = await saveWork(sessionId, body);
    if (!view) return Response.json({ error: "Nie znaleziono sesji" }, { status: 401 });
    work = view.work;
  }

  if (!shouldPersistDraft(work)) {
    return Response.json({ token: work.editorDraftToken, source: null });
  }

  const draft = await persistEditorDraft({ guestToken: sessionId, work });
  const next = await replaceWork(sessionId, (current) => ({ ...current, editorDraftToken: draft.token }));
  return Response.json({
    token: draft.token,
    source: draft.source,
    updated_at: draft.updated_at,
    work: next?.work ?? { ...work, editorDraftToken: draft.token },
  });
}
