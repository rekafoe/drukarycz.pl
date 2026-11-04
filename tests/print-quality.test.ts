import assert from "node:assert/strict";
import test from "node:test";
import { printAreaFabricPx } from "../components/souvenir3d/scale.ts";
import { imageDpi, issuesForArea, measureObject, textHeightMm } from "../lib/print-quality.ts";

const front = { id: "front", label: "Przód", widthMm: 300, heightMm: 400 };
const sheet = printAreaFabricPx(front.widthMm, front.heightMm, 1);

test("фото в полный лист с телефона проходит 300 dpi, мелкий скрин нет", () => {
  const sharp = {
    type: "image",
    left: sheet.widthPx / 2,
    top: sheet.heightPx / 2,
    width: 4000,
    height: 5000,
    scaleX: sheet.widthPx / 4000,
    scaleY: sheet.heightPx / 5000,
    originX: "center",
    originY: "center",
  };
  const soft = { type: "image", left: 0, top: 0, width: 400, height: 300, scaleX: 1, scaleY: 1 };
  assert.ok(imageDpi(measureObject(sharp)!) >= 300);
  assert.ok(imageDpi(measureObject(soft)!) < 300);
  const issues = issuesForArea(front, { objects: [soft] });
  assert.equal(issues.some((item) => item.code === "low_dpi"), true);
  assert.equal(issuesForArea(front, { objects: [sharp] }).some((item) => item.code === "low_dpi"), false);
});

test("ukryty obiekt nie wchodzi w uwagi, textbox tak", () => {
  const hidden = {
    type: "image",
    visible: false,
    left: -80,
    top: -80,
    width: 40,
    height: 40,
    scaleX: 8,
    scaleY: 8,
  };
  assert.equal(issuesForArea(front, { objects: [hidden] }).length, 0);
  const box = {
    type: "textbox",
    left: 40,
    top: 40,
    width: 90,
    height: 30,
    fontSize: 12,
    scaleX: 1,
    scaleY: 1,
    originX: "left",
    originY: "top",
  };
  assert.equal(issuesForArea(front, { objects: [box] }).some((item) => item.code === "small_text"), true);
});

test("текст ниже 5 мм и объект за краем", () => {
  const tiny = { type: "i-text", left: 100, top: 100, width: 80, height: 20, fontSize: 12, scaleX: 1, scaleY: 1, originX: "left", originY: "top" };
  const readable = { ...tiny, fontSize: 40 };
  assert.ok(textHeightMm(measureObject(tiny)!) < 5);
  assert.ok(textHeightMm(measureObject(readable)!) > 5);
  const overflow = { type: "i-text", left: sheet.widthPx - 10, top: 40, width: 80, height: 40, fontSize: 40, scaleX: 1, scaleY: 1, originX: "left", originY: "top" };
  const issues = issuesForArea(front, { objects: [tiny, overflow] });
  assert.deepEqual(
    issues.map((item) => item.code),
    ["out_of_bounds", "small_text"],
  );
});

test("Fabric 7 пишет тип IText и Image", () => {
  const text = { type: "IText", left: 40, top: 40, width: 80, height: 20, fontSize: 11, scaleX: 1, scaleY: 1, originX: "left", originY: "top" };
  const image = { type: "Image", left: 10, top: 10, width: 200, height: 200, scaleX: 1, scaleY: 1 };
  const issues = issuesForArea(front, { objects: [text, image] });
  assert.deepEqual(
    issues.map((item) => item.code),
    ["low_dpi", "small_text"],
  );
});

test("объект внутри листа не даёт замечаний", () => {
  const text = { type: "i-text", left: 200, top: 200, width: 120, height: 48, fontSize: 48, scaleX: 1, scaleY: 1, originX: "center", originY: "center" };
  assert.deepEqual(issuesForArea(front, { objects: [text] }), []);
});
