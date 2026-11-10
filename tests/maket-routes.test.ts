import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { editorPaths, merchDest, productPaths } from "../lib/catalog.ts";
import { editorSeo } from "../lib/seo.ts";
import {
  editorReturnPath,
  initialWork,
  openEditor,
  openShop,
  pathForWork,
  sanitizeWork,
} from "../lib/work.ts";
import { workForOwn } from "../lib/wzory/choose.ts";

const pages = { front: { objects: [{ text: "ZOSTAŃ" }] } };

test("у листа свои адреса, без hash и без templateId", () => {
  assert.deepEqual(editorPaths, { tshirt: "/koszulka/maket", mug: "/kubek/maket" });
  assert.equal(pathForWork({ step: "editor", product: "tshirt" }), "/koszulka/maket");
  assert.equal(pathForWork({ step: "editor", product: "mug" }), "/kubek/maket");
  assert.equal(pathForWork({ step: "shop", product: "tshirt" }), "/koszulka");
  assert.equal(pathForWork({ step: "doors", product: "tshirt" }), "/");
  assert.equal(pathForWork({ step: "cart", product: "mug" }), "/");
  for (const path of Object.values(editorPaths)) {
    assert.equal(path.includes("#"), false);
    assert.equal(path.toLowerCase().includes("template"), false);
  }
});

test("лавка не стирает лист, даже если зайти на неё из редактора", () => {
  const editor = { ...initialWork(), step: "editor" as const, product: "tshirt" as const, pages };
  const shop = openShop(editor, "tshirt");
  assert.equal(shop.step, "shop");
  assert.deepEqual(shop.pages, pages);
  assert.equal(openShop(editor, "mug").pages, pages);
});

test("адрес /maket открывает лист той же вещи и не трогает объекты", () => {
  const shop = { ...initialWork(), step: "shop" as const, product: "tshirt" as const, zone: "back", pages };
  const editor = openEditor(shop, "tshirt");
  assert.equal(editor.step, "editor");
  assert.equal(editor.product, "tshirt");
  assert.equal(editor.zone, "back");
  assert.deepEqual(editor.pages, pages);
  assert.equal(openEditor(editor, "tshirt"), editor);
  const mug = openEditor(editor, "mug");
  assert.equal(mug.product, "mug");
  assert.equal(mug.zone, "wrap");
  assert.deepEqual(mug.pages, pages);
});

test("назад с листа — на лавку или на карточку wzoru, не на templateId", () => {
  const own = { ...initialWork(), step: "editor" as const, editorBack: "shop" as const };
  assert.equal(editorReturnPath(own), "/koszulka");
  const fromWzor = {
    ...own,
    editorBack: "wzor" as const,
    design: {
      templateId: 99,
      code: "000102",
      usageFee: 8,
      product: "tshirt" as const,
      fingerprint: "x",
      modified: false,
      fonts: [],
      previews: {},
    },
  };
  assert.equal(editorReturnPath(fromWzor), "/wzory/000102");
  assert.equal(editorReturnPath(fromWzor).includes("99"), false);
  assert.equal(editorReturnPath(fromWzor).includes("template"), false);
});

test("чужой path из API не уводит с лавки или листа", () => {
  assert.equal(merchDest("/koszulka/maket", "/kubek/maket"), "/koszulka/maket");
  assert.equal(merchDest("/koszulka", "/"), "/koszulka");
  assert.equal(merchDest("/koszulka/maket?templateId=12", "/koszulka/maket"), "/koszulka/maket");
  assert.equal(merchDest("/koszulka/maket#x", "/koszulka/maket"), "/koszulka/maket");
  assert.equal(merchDest("https://evil.example/", "/koszulka/maket"), "/koszulka/maket");
});

test("«Zrób własny» открывает лист и помнит возврат на лавку", () => {
  const next = workForOwn({ ...initialWork(), pages, design: null }, "mug");
  assert.equal(next.step, "editor");
  assert.equal(next.product, "mug");
  assert.equal(next.editorBack, "shop");
  assert.deepEqual(next.pages, pages);
});

test("sanitizeWork хранит editorBack и не требует templateId в адресе", () => {
  const kept = sanitizeWork({ ...initialWork(), step: "editor", editorBack: "wzor" }, false);
  assert.equal(kept.editorBack, "wzor");
  assert.equal(sanitizeWork(initialWork(), false).editorBack, "shop");
});

test("SEO-лавка не монтирует холст, лист — noindex и не в sitemap", () => {
  const shopPage = fs.readFileSync("components/product-page.tsx", "utf8");
  const flow = fs.readFileSync("components/merch-flow.tsx", "utf8");
  const editorPage = fs.readFileSync("components/editor-page.tsx", "utf8");
  const sitemap = fs.readFileSync("app/sitemap.ts", "utf8");
  const config = fs.readFileSync("next.config.ts", "utf8");
  assert.match(shopPage, /surface="shop"/);
  assert.match(shopPage, /openShop/);
  assert.equal(shopPage.includes("openEditor"), false);
  assert.equal(shopPage.includes("EditorCanvas"), false);
  assert.match(flow, /surface === "editor" && work\.step !== "cart"/);
  assert.match(flow, /<EditorCanvas/);
  assert.equal(flow.includes("location.hash"), false);
  assert.equal(editorPage.includes("searchParams"), false);
  assert.equal(editorPage.toLowerCase().includes("templateid"), false);
  assert.match(editorPage, /openEditor/);
  assert.equal(editorSeo.tshirt.noindex, true);
  assert.equal(editorSeo.mug.noindex, true);
  assert.equal(editorSeo.tshirt.path, "/koszulka/maket");
  assert.equal(sitemap.includes("maket"), false);
  assert.match(config, /\/koszulka\/maket/);
  assert.match(config, /\/kubek\/maket/);
  assert.equal(fs.existsSync("app/koszulka/maket/page.tsx"), true);
  assert.equal(fs.existsSync("app/kubek/maket/page.tsx"), true);
});

test("лавки и лист — разные страницы", () => {
  assert.notEqual(productPaths.tshirt, editorPaths.tshirt);
  assert.notEqual(productPaths.mug, editorPaths.mug);
  const shirtMaket = fs.readFileSync("app/koszulka/maket/page.tsx", "utf8");
  const mugMaket = fs.readFileSync("app/kubek/maket/page.tsx", "utf8");
  assert.match(shirtMaket, /ProductEditorPage/);
  assert.match(mugMaket, /ProductEditorPage/);
  assert.equal(shirtMaket.includes("templateId"), false);
  assert.equal(mugMaket.includes("templateId"), false);
});
