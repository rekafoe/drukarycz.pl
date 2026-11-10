import assert from "node:assert/strict";
import test from "node:test";
import { productPaths } from "../lib/catalog.ts";
import { initialWork, openShop, sanitizeWork, workHeadline } from "../lib/work.ts";

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
