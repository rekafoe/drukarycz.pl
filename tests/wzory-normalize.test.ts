import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { initialWork, sanitizeWork } from "../lib/work.ts";
import { withoutDesign, workWithWzor } from "../lib/wzory/choose.ts";
import { pagesFingerprint } from "../lib/wzory/fingerprint.ts";
import { localAssets, normalizeWzor, rewriteAsset, SITE_UNITS_PER_MM } from "../lib/wzory/normalize.ts";
import type { WzorDetail } from "../lib/wzory/types.ts";

const links = JSON.parse(readFileSync(new URL("../fixtures/wzory/produkty.json", import.meta.url), "utf8"));
const shirt = { product: "tshirt" as const, link: links.koszulka, assets: localAssets };
const mug = { product: "mug" as const, link: links.kubek, assets: localAssets };

function fixture(id: number) {
  return JSON.parse(readFileSync(new URL(`../fixtures/wzory/detail/${id}.json`, import.meta.url), "utf8"));
}

function withSpec(id: number, change: (spec: Record<string, unknown>) => void) {
  const raw = fixture(id);
  const spec = JSON.parse(raw.spec);
  change(spec);
  return { ...raw, spec: JSON.stringify(spec) };
}

function ok(result: ReturnType<typeof normalizeWzor>): WzorDetail {
  assert.equal(result.ok, true, result.ok ? "" : `${result.reason}: ${result.detail}`);
  return (result as { ok: true; wzor: WzorDetail }).wzor;
}

type Obj = Record<string, number | string>;

test("мм холста CRM переводятся в CSS-пиксели редактора, текст растёт кеглем", () => {
  const raw = fixture(101);
  const source = JSON.parse(raw.spec).designState.pages[0].fabricJSON.objects[1] as Obj;
  const wzor = ok(normalizeWzor(raw, shirt));
  const text = wzor.pages.front!.objects[1] as Obj;
  assert.ok(Math.abs((text.left as number) - (source.left as number) * SITE_UNITS_PER_MM) < 0.01);
  assert.ok(Math.abs((text.fontSize as number) - (source.fontSize as number) * SITE_UNITS_PER_MM) < 0.01);
  assert.equal(text.scaleX, 1);
  assert.equal(wzor.code, "000101");
  assert.equal(wzor.usageFee, 5);
});

test("пустой оборот не попадает в usedPrintAreaIds, оборот с объектами попадает", () => {
  assert.deepEqual(ok(normalizeWzor(fixture(101), shirt)).usedPrintAreaIds, ["front"]);
  assert.deepEqual(ok(normalizeWzor(fixture(102), shirt)).usedPrintAreaIds, ["front", "back"]);
});

test("пиксельный шаблон с sceneScale 3 пересчитывается через мм", () => {
  const raw = fixture(104);
  const state = JSON.parse(raw.spec).designState;
  const source = state.pages[0].fabricJSON.objects[0] as Obj;
  const wzor = ok(normalizeWzor(raw, shirt));
  const object = wzor.pages.front!.objects[0] as Obj;
  const mm = (source.left as number) / ((96 / 25.4) * state.sceneScale);
  assert.ok(Math.abs((object.left as number) - mm * SITE_UNITS_PER_MM) < 0.01);
  assert.ok(wzor.warnings.some((line) => line.includes("sceneScale")));
});

test("плохие шаблоны отбрасываются с понятной причиной", () => {
  const wide = normalizeWzor(fixture(901), mug);
  assert.equal(wide.ok, false);
  assert.equal(!wide.ok && wide.reason, "zone");
  assert.match(!wide.ok ? wide.detail : "", /210×95/);

  const flat = normalizeWzor(fixture(902), shirt);
  assert.equal(!flat.ok && flat.reason, "not_souvenir");

  const blank = normalizeWzor(fixture(200), mug);
  assert.equal(!blank.ok && blank.reason, "blank");

  const otherProduct = normalizeWzor(fixture(201), shirt);
  assert.equal(!otherProduct.ok && otherProduct.reason, "product");

  const inactive = normalizeWzor({ ...fixture(101), is_active: 0 }, shirt);
  assert.equal(!inactive.ok && inactive.reason, "inactive");

  const broken = normalizeWzor({ ...fixture(101), design_code: "abc" }, shirt);
  assert.equal(!broken.ok && broken.reason, "schema");
});

test("страница без printAreaId ложится в зону по порядку с предупреждением", () => {
  const raw = withSpec(101, (spec) => {
    const state = spec.designState as { pages: Array<Record<string, unknown>> };
    delete state.pages[0].printAreaId;
    delete state.pages[1].printAreaId;
  });
  const wzor = ok(normalizeWzor(raw, shirt));
  assert.deepEqual(wzor.usedPrintAreaIds, ["front"]);
  assert.ok(wzor.warnings.some((line) => line.includes("printAreaId")));
});

test("картинка с чужого адреса отбрасывает шаблон, адрес CRM уходит в /media/crm", () => {
  const raw = withSpec(103, (spec) => {
    const state = spec.designState as { pages: Array<{ fabricJSON: { objects: Obj[] } }> };
    const photo = state.pages[0].fabricJSON.objects.find((object) => object.type === "Image")!;
    photo.src = "https://cdn.example.com/photo.jpg";
  });
  const result = normalizeWzor(raw, shirt);
  assert.equal(!result.ok && result.reason, "asset");

  const crm = { mode: "crm" as const, origin: "https://crm.drukarycz.pl" };
  assert.equal(rewriteAsset("/storage/designs/1.png", crm), "/media/crm/storage/designs/1.png");
  assert.equal(rewriteAsset("https://crm.drukarycz.pl/storage/a.png?v=2", crm), "/media/crm/storage/a.png?v=2");
  assert.equal(rewriteAsset("https://evil.example/a.png", crm), null);
  assert.equal(rewriteAsset("//evil.example/a.png", localAssets), null);
  assert.equal(rewriteAsset("/api/session", localAssets), null);
});

test("шрифт не со своего сервера снимает «Zamów bez zmian», но шаблон остаётся", () => {
  const raw = withSpec(101, (spec) => {
    spec.requiredFonts = [{ id: 1, family: "Archivo Black", url: "https://fonts.example/a.ttf" }];
  });
  const wzor = ok(normalizeWzor(raw, shirt));
  assert.equal(wzor.asIs, false);
  assert.deepEqual(wzor.fonts, []);
  assert.equal(ok(normalizeWzor(fixture(101), shirt)).asIs, true);
});

test("проект хранит wzór, отмечает правку и снимает его при смене вещи", () => {
  const wzor = ok(normalizeWzor(fixture(102), shirt));
  const chosen = workWithWzor(initialWork(), wzor, "edit");
  assert.equal(chosen.step, "editor");
  assert.equal(chosen.editorBack, "wzor");
  assert.equal(chosen.design?.templateId, 102);

  const kept = sanitizeWork(JSON.parse(JSON.stringify(chosen)), false, chosen);
  assert.equal(kept.design?.code, "000102");
  assert.equal(kept.design?.modified, false);

  const forged = sanitizeWork({ ...chosen, design: { ...chosen.design, usageFee: 0 } }, false, chosen);
  assert.equal(forged.design?.usageFee, 8);
  assert.equal(sanitizeWork({ ...chosen, design: { templateId: 1 } }, false, initialWork()).design, null);

  const edited = structuredClone(chosen);
  (edited.pages.back!.objects[0] as Obj).text = "KOWALSKI";
  assert.equal(sanitizeWork(edited, false, chosen).design?.modified, true);

  const switched = sanitizeWork({ ...chosen, product: "mug", zone: "wrap" }, false, chosen);
  assert.equal(switched.design, null);
  assert.equal(switched.pages.front, undefined);
  assert.equal(switched.pages.back, undefined);

  const cleared = sanitizeWork(withoutDesign(chosen), false, chosen);
  assert.equal(cleared.design, null);
  assert.equal(Object.keys(cleared.pages).length, 0);
});

test("отпечаток листов переживает круг loadFromJSON → toObject в Fabric", async (t) => {
  let fabric: typeof import("fabric/node");
  try {
    fabric = await import("fabric/node");
  } catch {
    t.skip("fabric/node без canvas");
    return;
  }
  for (const id of [101, 102]) {
    const wzor = ok(normalizeWzor(fixture(id), shirt));
    const roundTrip: Record<string, object> = {};
    for (const [area, page] of Object.entries(wzor.pages)) {
      const canvas = new fabric.StaticCanvas(undefined, { width: 1134, height: 1512 });
      await canvas.loadFromJSON(page);
      roundTrip[area] = canvas.toObject();
      await canvas.dispose();
    }
    assert.equal(pagesFingerprint(roundTrip), pagesFingerprint(wzor.pages), `wzór ${id}`);
  }
});
