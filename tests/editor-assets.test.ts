import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { printFonts } from "../lib/print-fonts.ts";
import { stickers } from "../lib/stickers.ts";

test("czcionki druku to lokalne woff2 z polskim zakresem", () => {
  const css = fs.readFileSync("app/print-fonts.css", "utf8");
  assert.equal(css.includes("http"), false);
  const urls = [...css.matchAll(/url\("(\/fonts\/[^"]+\.woff2)"\)/g)].map((match) => match[1]);
  assert.ok(urls.some((url) => url.includes("latin-ext")));
  assert.ok(urls.length >= 16);
  for (const url of urls) assert.equal(fs.existsSync(`public${url}`), true);
  assert.ok(printFonts.some((font) => font.italic));
  assert.ok(printFonts.some((font) => !font.italic));
});

test("naklejki nie wskazują na obce adresy", () => {
  assert.ok(stickers.length >= 6);
  for (const sticker of stickers) {
    assert.equal(/https?:\/\/(?!www\.w3\.org\/2000\/svg)/.test(sticker.svg), false);
    assert.equal(sticker.svg.includes("href="), false);
    assert.ok(sticker.label.length > 0);
  }
});
