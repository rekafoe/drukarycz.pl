import { getEditorDraft, persistEditorDraft } from "@/lib/crm/drafts";
import { applyDraftPayload } from "@/lib/editor/souvenir-state";
import { currentSession, requireSessionId } from "@/lib/session";
import { replaceWork, saveWork } from "@/lib/store";
import { sanitizeDraftToken } from "@/lib/work";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ token: string }> };

function badToken() {
  return Response.json({ error: "Zły token szkicu" }, { status: 400 });
}

/** GET /api/editor/drafts/:token — перечитать черновик. `?apply=1` кладёт designState обратно в сессию. */
export async function GET(request: Request, context: RouteContext) {
  await requireSessionId();
  const token = sanitizeDraftToken((await context.params).token);
  if (!token) return badToken();
  const draft = await getEditorDraft(token);
  if (!draft) return Response.json({ error: "Nie znaleziono szkicu" }, { status: 404 });

  const apply = new URL(request.url).searchParams.get("apply") === "1";
  if (apply) {
    const sessionId = await requireSessionId();
    await replaceWork(sessionId, (work) =>
      applyDraftPayload({ ...work, editorDraftToken: token }, draft.payloadParsed),
    );
  }

  return Response.json({
    token: draft.token,
    source: draft.source,
    mode: draft.mode,
    status: draft.status,
    updated_at: draft.updated_at,
    payloadParsed: draft.payloadParsed,
  });
}

/** PATCH /api/editor/drafts/:token — дописать designState в уже известный токен. */
export async function PATCH(request: Request, context: RouteContext) {
  const sessionId = await requireSessionId();
  const token = sanitizeDraftToken((await context.params).token);
  if (!token) return badToken();
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  if (body && typeof body === "object") {
    const view = await saveWork(sessionId, { ...(body as object), editorDraftToken: token });
    if (!view) return Response.json({ error: "Nie znaleziono sesji" }, { status: 401 });
  }
  const work = { ...(await currentSession()).work, editorDraftToken: token };
  const draft = await persistEditorDraft({ guestToken: sessionId, work });
  const next = await replaceWork(sessionId, (current) => ({ ...current, editorDraftToken: draft.token }));
  return Response.json({
    token: draft.token,
    source: draft.source,
    updated_at: draft.updated_at,
    work: next?.work ?? work,
  });
}
