import assert from "node:assert/strict";
import test from "node:test";
import { inkForFabric } from "../lib/work.ts";

test("тёмная ткань получает белые чернила, светлая — тёмные", () => {
  assert.equal(inkForFabric("#171614"), "#ffffff");
  assert.equal(inkForFabric("#7d1d1d"), "#ffffff");
  assert.equal(inkForFabric("#1e3a5f"), "#ffffff");
  assert.equal(inkForFabric("#f4f1ea"), "#1a1916");
  assert.equal(inkForFabric("нет"), "#1a1916");
});
