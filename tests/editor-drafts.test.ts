import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { getEditorDraft, isMockDraftToken, persistEditorDraft, shouldPersistDraft } from "../lib/crm/drafts.ts";
import { crmMediaPath, crmMediaSearch } from "../lib/crm/media.ts";
import { designsSourceKind } from "../lib/crm/config.ts";
import { applyDraftPayload, buildSouvenirDesignState, pagesFromDesignState, workHasMaket } from "../lib/editor/souvenir-state.ts";
import { initialWork, sanitizeDraftToken, sanitizeWork } from "../lib/work.ts";
import { designOrderParams, workWithWzor } from "../lib/wzory/choose.ts";
import { localAssets, normalizeWzor } from "../lib/wzory/normalize.ts";
import { designsSource } from "../lib/wzory/source.ts";
import { readFileSync } from "node:fs";

const links = JSON.parse(readFileSync(new URL("../fixtures/wzory/produkty.json", import.meta.url), "utf8"));
const shirt = { product: "tshirt" as const, link: links.koszulka, assets: localAssets };

function fixture(id: number) {
  return JSON.parse(readFileSync(new URL(`../fixtures/wzory/detail/${id}.json`, import.meta.url), "utf8"));
}

function okWzor(id: number) {
  const result = normalizeWzor(fixture(id), shirt);
  assert.equal(result.ok, true);
  return result.ok ? result.wzor : (assert.fail(), null as never);
}

test("токен черновика принимаем только как CRM base64url или mock_", () => {
  assert.equal(sanitizeDraftToken("mock_abcdefghijklmnopqrstuvwx"), "mock_abcdefghijklmnopqrstuvwx");
  assert.equal(sanitizeDraftToken("AbcdefghijklmnopQRSTUV"), "AbcdefghijklmnopQRSTUV");
  assert.equal(sanitizeDraftToken("http://evil.example/x"), null);
  assert.equal(sanitizeDraftToken("short"), null);
  assert.equal(isMockDraftToken("mock_abcdefghijklmnopqrstuvwx"), true);
});

test("пустой лист не пишем в CRM, лист с объектами — пишем", () => {
  assert.equal(shouldPersistDraft(initialWork()), false);
  const wzor = okWzor(101);
  const chosen = workWithWzor(initialWork(), wzor, "as-is");
  assert.equal(shouldPersistDraft(chosen), true);
  assert.equal(workHasMaket(chosen), true);
});

test("designState сувенира: страница на зону, пустая спина не в usedPrintAreaIds", () => {
  const wzor = okWzor(101);
  const work = workWithWzor(initialWork(), wzor, "edit");
  const state = buildSouvenirDesignState(work);
  assert.equal(state.editorKind, "souvenir_3d");
  assert.equal(state.sceneScale, 1);
  assert.deepEqual(
    state.pages.map((page) => page.printAreaId),
    ["front", "back"],
  );
  assert.deepEqual(state.usedPrintAreaIds, ["front"]);
  const pages = pagesFromDesignState(state);
  assert.ok(pages.front);
  const restored = applyDraftPayload(initialWork(), { designState: state, activePrintAreaId: "front" });
  assert.ok(restored.pages.front);
  assert.equal(restored.zone, "front");
});

test("позиция корзины несёт editorDraftToken, без operator_percent и per_m2", () => {
  const wzor = okWzor(101);
  const work = {
    ...workWithWzor(initialWork(), wzor, "as-is"),
    editorDraftToken: "mock_abcdefghijklmnopqrstuvwx",
  };
  const params = designOrderParams(work);
  assert.equal(params.editorDraftToken, "mock_abcdefghijklmnopqrstuvwx");
  assert.equal(params.editorKind, "souvenir_3d");
  assert.equal(params.editorDraftMode, "souvenir_3d");
  assert.equal(params.designTemplateId, 101);
  assert.equal("operator_percent" in params, false);
  assert.equal("per_m2" in params, false);
  assert.equal("productionPlan" in params, false);
});

test("sanitizeWork держит токен и сбрасывает его при смене вещи", () => {
  const wzor = okWzor(101);
  const chosen = {
    ...workWithWzor(initialWork(), wzor, "edit"),
    editorDraftToken: "mock_abcdefghijklmnopqrstuvwx",
  };
  const kept = sanitizeWork(JSON.parse(JSON.stringify(chosen)), false, chosen);
  assert.equal(kept.editorDraftToken, "mock_abcdefghijklmnopqrstuvwx");

  const switched = sanitizeWork({ ...chosen, product: "mug", zone: "wrap" }, false, chosen);
  assert.equal(switched.editorDraftToken, null);
  assert.equal(switched.design, null);
});

test("без CRM_URL источник остаётся fixtures даже при DESIGNS_SOURCE=crm", () => {
  const previousSource = process.env.DESIGNS_SOURCE;
  const previousUrl = process.env.CRM_URL;
  const previousApi = process.env.CRM_API_URL;
  process.env.DESIGNS_SOURCE = "crm";
  delete process.env.CRM_URL;
  delete process.env.CRM_API_URL;
  try {
    assert.equal(designsSourceKind(), "fixtures");
    assert.equal(designsSource().kind, "fixtures");
  } finally {
    if (previousSource === undefined) delete process.env.DESIGNS_SOURCE;
    else process.env.DESIGNS_SOURCE = previousSource;
    if (previousUrl === undefined) delete process.env.CRM_URL;
    else process.env.CRM_URL = previousUrl;
    if (previousApi === undefined) delete process.env.CRM_API_URL;
    else process.env.CRM_API_URL = previousApi;
  }
});

test("прокси медиа пускает только uploads, ассеты шаблона и шрифты CRM", () => {
  assert.equal(crmMediaPath(["api", "uploads", "a.png"]), "/api/uploads/a.png");
  assert.equal(
    crmMediaPath(["api", "design-templates", "public", "12", "assets", "3", "content"]),
    "/api/design-templates/public/12/assets/3/content",
  );
  assert.equal(crmMediaPath(["api", "design-fonts", "public", "4", "content"]), "/api/design-fonts/public/4/content");
  assert.equal(crmMediaPath(["storage", "designs", "1.png"]), "/storage/designs/1.png");
  assert.equal(crmMediaPath(["api", "orders", "1"]), null);
  assert.equal(crmMediaPath(["api", "public-editor", "drafts"]), null);
  assert.equal(crmMediaPath(["..", "etc", "passwd"]), null);
  assert.equal(crmMediaSearch("v=2"), "v=2");
  assert.equal(crmMediaSearch("url=https://evil.example"), "");
});

test("persist без CRM даёт локальный mock-токен, GET его читает", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "drukarycz-drafts-"));
  const previous = process.env.EDITOR_DRAFT_STORE;
  process.env.EDITOR_DRAFT_STORE = path.join(dir, "drafts.json");
  delete process.env.CRM_URL;
  delete process.env.CRM_API_URL;
  delete process.env.WEBSITE_ORDER_API_KEY;
  try {
    const wzor = okWzor(102);
    const work = workWithWzor(initialWork(), wzor, "edit");
    const created = await persistEditorDraft({ guestToken: "guest-session-token12", work });
    assert.equal(created.source, "mock");
    assert.ok(created.token.startsWith("mock_"));
    assert.equal((created.payloadParsed.designState as { editorKind?: string }).editorKind, "souvenir_3d");
    assert.deepEqual(
      (created.payloadParsed as { usedPrintAreaIds: string[] }).usedPrintAreaIds,
      ["front", "back"],
    );

    const loaded = await getEditorDraft(created.token);
    assert.ok(loaded);
    assert.equal(loaded?.token, created.token);
    const restored = applyDraftPayload(initialWork(), loaded?.payloadParsed);
    assert.ok(restored.pages.front);
    assert.ok(restored.pages.back);

    const again = await persistEditorDraft({
      guestToken: "guest-session-token12",
      work: { ...work, editorDraftToken: created.token },
    });
    assert.equal(again.token, created.token);
  } finally {
    if (previous === undefined) delete process.env.EDITOR_DRAFT_STORE;
    else process.env.EDITOR_DRAFT_STORE = previous;
    rmSync(dir, { recursive: true, force: true });
  }
});
