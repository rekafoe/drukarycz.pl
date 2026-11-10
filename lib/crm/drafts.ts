import { mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { canUseCrmDrafts } from "@/lib/crm/config";
import { CrmUnreachableError, fetchCrm, readCrmJson } from "@/lib/crm/fetch";
import { productSlugOf, siteProductLink } from "@/lib/crm/products";
import { draftRequestPayload, workHasMaket } from "@/lib/editor/souvenir-state";
import { sanitizeDraftToken, type WorkSnapshot } from "@/lib/work";

export type DraftSource = "crm" | "mock";

export type EditorDraftView = {
  token: string;
  source: DraftSource;
  mode: string;
  status: string;
  design_template_id: number | null;
  product_id: number | null;
  type_id: number | null;
  updated_at: string;
  payloadParsed: Record<string, unknown>;
};

type MockFile = { drafts: Record<string, EditorDraftView> };

const MOCK_PREFIX = "mock_";

export function isMockDraftToken(token: string) {
  return token.startsWith(MOCK_PREFIX);
}

export function mockDraftsPath() {
  return process.env.EDITOR_DRAFT_STORE || path.join(process.cwd(), "data", "editor-drafts.json");
}

function emptyMock(): MockFile {
  return { drafts: {} };
}

function readMock(): MockFile {
  try {
    const parsed = JSON.parse(readFileSync(mockDraftsPath(), "utf8")) as Partial<MockFile>;
    return { drafts: parsed.drafts && typeof parsed.drafts === "object" ? parsed.drafts : {} };
  } catch {
    return emptyMock();
  }
}

function writeMock(file: MockFile) {
  const target = mockDraftsPath();
  mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp`;
  writeFileSync(tmp, JSON.stringify(file));
  renameSync(tmp, target);
}

function newMockToken() {
  return `${MOCK_PREFIX}${randomBytes(18).toString("base64url")}`;
}

function asDraftView(raw: unknown, source: DraftSource, fallbackToken: string): EditorDraftView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const token = sanitizeDraftToken(row.token) ?? fallbackToken;
  if (!token) return null;
  const payloadParsed =
    row.payloadParsed && typeof row.payloadParsed === "object" && !Array.isArray(row.payloadParsed)
      ? (row.payloadParsed as Record<string, unknown>)
      : typeof row.payload === "string"
        ? safeJson(row.payload)
        : row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
          ? (row.payload as Record<string, unknown>)
          : {};
  return {
    token,
    source,
    mode: typeof row.mode === "string" ? row.mode : "souvenir_3d",
    status: typeof row.status === "string" ? row.status : "draft",
    design_template_id: typeof row.design_template_id === "number" ? row.design_template_id : null,
    product_id: typeof row.product_id === "number" ? row.product_id : null,
    type_id: typeof row.type_id === "number" ? row.type_id : null,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
    payloadParsed,
  };
}

function safeJson(text: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function draftMeta(work: WorkSnapshot) {
  const link = await siteProductLink(productSlugOf(work.product));
  return {
    designTemplateId: work.design?.templateId,
    productId: link?.productId,
    typeId: link?.typeId,
    mode: "souvenir_3d" as const,
    payload: draftRequestPayload(work),
  };
}

function saveMock(input: {
  token: string;
  work: WorkSnapshot;
  meta: Awaited<ReturnType<typeof draftMeta>>;
}): EditorDraftView {
  const file = readMock();
  const now = new Date().toISOString();
  const previous = file.drafts[input.token];
  const view: EditorDraftView = {
    token: input.token,
    source: "mock",
    mode: "souvenir_3d",
    status: "draft",
    design_template_id: input.meta.designTemplateId ?? null,
    product_id: input.meta.productId ?? null,
    type_id: input.meta.typeId ?? null,
    updated_at: now,
    payloadParsed: input.meta.payload as unknown as Record<string, unknown>,
  };
  file.drafts[input.token] = previous ? { ...view, updated_at: now } : view;
  writeMock(file);
  return file.drafts[input.token];
}

async function createCrmDraft(guestToken: string, meta: Awaited<ReturnType<typeof draftMeta>>) {
  const body: Record<string, unknown> = {
    mode: meta.mode,
    payload: meta.payload,
    guestToken,
  };
  if (meta.designTemplateId) body.designTemplateId = meta.designTemplateId;
  if (meta.productId) body.productId = meta.productId;
  if (meta.typeId) body.typeId = meta.typeId;
  const response = await fetchCrm("/api/public-editor/drafts", {
    method: "POST",
    apiKey: true,
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new CrmUnreachableError(`CRM draft ${response.status}`);
  const json = await readCrmJson(response);
  const view = asDraftView(json, "crm", "");
  if (!view?.token) throw new CrmUnreachableError("CRM не вернула token");
  return view;
}

async function patchCrmDraft(token: string, meta: Awaited<ReturnType<typeof draftMeta>>) {
  const response = await fetchCrm(`/api/public-editor/drafts/${encodeURIComponent(token)}`, {
    method: "PATCH",
    apiKey: true,
    body: JSON.stringify(meta.payload),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new CrmUnreachableError(`CRM draft ${response.status}`);
  const json = await readCrmJson(response);
  return asDraftView(json, "crm", token);
}

async function readCrmDraft(token: string) {
  const response = await fetchCrm(`/api/public-editor/drafts/${encodeURIComponent(token)}`, {
    method: "GET",
    apiKey: true,
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new CrmUnreachableError(`CRM draft ${response.status}`);
  const json = await readCrmJson(response);
  return asDraftView(json, "crm", token);
}

/**
 * Пишет designState в CRM `/public-editor/drafts` или, если CRM молчит, в локальный файл.
 * Гость может собрать макет: в CRM уходит guestToken = id сессии сайта.
 */
export async function persistEditorDraft(input: {
  guestToken: string;
  work: WorkSnapshot;
}): Promise<EditorDraftView> {
  const meta = await draftMeta(input.work);
  const existing = sanitizeDraftToken(input.work.editorDraftToken);

  if (canUseCrmDrafts()) {
    if (existing && !isMockDraftToken(existing)) {
      try {
        const patched = await patchCrmDraft(existing, meta);
        if (patched) return patched;
      } catch (error) {
        console.warn("[crm] не удалось обновить черновик, локальный токен", error instanceof Error ? error.message : "");
      }
    }
    try {
      return await createCrmDraft(input.guestToken, meta);
    } catch (error) {
      console.warn("[crm] не удалось создать черновик, локальный токен", error instanceof Error ? error.message : "");
    }
  }

  const token = existing && isMockDraftToken(existing) ? existing : newMockToken();
  return saveMock({ token, work: input.work, meta });
}

export async function getEditorDraft(token: string): Promise<EditorDraftView | null> {
  const safe = sanitizeDraftToken(token);
  if (!safe) return null;
  if (isMockDraftToken(safe)) return readMock().drafts[safe] ?? null;
  if (canUseCrmDrafts()) {
    try {
      return await readCrmDraft(safe);
    } catch (error) {
      console.warn("[crm] не удалось прочитать черновик", error instanceof Error ? error.message : "");
      return null;
    }
  }
  return readMock().drafts[safe] ?? null;
}

export function shouldPersistDraft(work: WorkSnapshot) {
  return workHasMaket(work);
}
