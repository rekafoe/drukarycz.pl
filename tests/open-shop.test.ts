import assert from "node:assert/strict";
import test from "node:test";
import { editorPaths, productPaths } from "../lib/catalog.ts";
import { initialWork, openEditor, openShop, sanitizeWork, workHeadline } from "../lib/work.ts";

test("адрес лавки открывает её как клик по двери и не трогает листы", () => {
  const work = { ...initialWork(), step: "editor" as const, product: "tshirt" as const, pages: { front: { objects: [1] } } };
  const mug = openShop(work, "mug");
  assert.equal(mug.step, "shop");
  assert.equal(mug.product, "mug");
  assert.equal(mug.zone, "wrap");
  assert.deepEqual(mug.pages, work.pages);
  assert.equal(openShop(mug, "mug"), mug);
});

test("у каждой вещи свой читаемый адрес", () => {
  assert.deepEqual(productPaths, { tshirt: "/koszulka", mug: "/kubek" });
  assert.deepEqual(editorPaths, { tshirt: "/koszulka/maket", mug: "/kubek/maket" });
});

test("заход на лавку из редактора не чистит холст", () => {
  const work = { ...initialWork(), step: "editor" as const, pages: { wrap: { objects: [{ t: 1 }] } } };
  const shop = openShop(work, "tshirt");
  assert.equal(shop.step, "shop");
  assert.deepEqual(shop.pages, work.pages);
  assert.deepEqual(openEditor(shop, "tshirt").pages, work.pages);
});

test("sanitizeWork nie trzyma wykończenia z dawnego zapisu", () => {
  const work = sanitizeWork({ ...initialWork(), finish: "gloss" }, false);
  assert.equal("finish" in work, false);
});

test("шапка редактора — размер, цвет, тираж, без wykończenia", () => {
  const shirt = workHeadline(initialWork());
  assert.equal(shirt, "M · Czarny · 1 szt.");
  assert.doesNotMatch(shirt, /wykończen/i);
  const mug = workHeadline({ ...initialWork(), product: "mug", qty: "5" });
  assert.equal(mug, "330 ml · Czarny · 5 szt.");
});

test("sanitizeWork nie ogranicza nakładu do paczek 1/5/10/20", () => {
  assert.equal(sanitizeWork({ ...initialWork(), qty: "7" }, false).qty, "7");
});
