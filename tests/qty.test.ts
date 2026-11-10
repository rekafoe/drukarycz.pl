import assert from "node:assert/strict";
import test from "node:test";
import { goodsPriceLabel, linePriceLabel, parseQty, qtyMax, qtyString } from "../lib/qty.ts";
import { initialWork, sanitizeWork, workHeadline } from "../lib/work.ts";

test("parseQty przyjmuje dowolną liczbę całkowitą ≥ 1", () => {
  assert.equal(parseQty("7"), 7);
  assert.equal(parseQty("2"), 2);
  assert.equal(parseQty(20), 20);
  assert.equal(parseQty(" 12 "), 12);
  assert.equal(qtyString("7"), "7");
});

test("parseQty odrzuca ułamki, zero i śmieci", () => {
  assert.equal(parseQty("0"), 1);
  assert.equal(parseQty("-3"), 1);
  assert.equal(parseQty("1.5"), 1);
  assert.equal(parseQty("abc"), 1);
  assert.equal(parseQty(""), 1);
  assert.equal(parseQty(1.9), 1);
  assert.equal(parseQty(qtyMax + 10), qtyMax);
});

test("cena idzie za nakładem, wzór doliczany raz", () => {
  assert.equal(goodsPriceLabel("1"), "od 5 zł × 1");
  assert.equal(goodsPriceLabel("7"), "od 5 zł × 7");
  assert.equal(linePriceLabel("7", 0), "od 5 zł × 7");
  assert.match(linePriceLabel("7", 12), /od 5 zł × 7/);
  assert.match(linePriceLabel("7", 12), /12 zł za wzór/);
  assert.doesNotMatch(linePriceLabel("7", 12), /× 12/);
});

test("sanitizeWork trzyma nakład poza paczkami 1/5/10/20", () => {
  const seven = sanitizeWork({ ...initialWork(), qty: "7" }, false);
  assert.equal(seven.qty, "7");
  const two = sanitizeWork({ ...initialWork(), qty: 2 }, false);
  assert.equal(two.qty, "2");
  const bad = sanitizeWork({ ...initialWork(), qty: "0" }, false);
  assert.equal(bad.qty, "1");
  assert.equal(workHeadline({ ...initialWork(), qty: "7" }), "M · Czarny · 7 szt.");
});
