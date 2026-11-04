import assert from "node:assert/strict";
import test from "node:test";
import { productPaths } from "../lib/catalog.ts";
import { initialWork, openShop } from "../lib/work.ts";

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
