import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const FONT_CDN = /fonts\.googleapis\.com|fonts\.gstatic\.com/;
const GOOGLE_FONT_IMPORT = /from\s+["']next\/font\/google["']/;
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "data"]);
const TEXT_EXT = /\.(ts|tsx|js|jsx|css|mjs|html|md|json)$/;

function walk(dir: string, files: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (TEXT_EXT.test(entry.name)) files.push(full);
  }
  return files;
}

function sourceFiles() {
  const files = ["app", "components", "lib", "public", "scripts"].flatMap((dir) => walk(dir));
  for (const extra of ["README.md", "next.config.ts", "package.json"]) {
    if (fs.existsSync(extra)) files.push(extra);
  }
  return files;
}

test("źródła nie ładują czcionek z CDN Google", () => {
  const hits: string[] = [];
  for (const file of sourceFiles()) {
    const text = fs.readFileSync(file, "utf8");
    if (FONT_CDN.test(text) || GOOGLE_FONT_IMPORT.test(text)) hits.push(file);
  }
  assert.deepEqual(hits, []);
});

test("Manrope to lokalny zmienny woff2 200–800", () => {
  assert.equal(fs.existsSync("public/fonts/manrope-latin-wght.woff2"), true);
  assert.equal(fs.existsSync("public/fonts/manrope-pl-wght.woff2"), true);
  assert.equal(fs.existsSync("public/fonts/OFL-Manrope.txt"), true);
  const css = [
    fs.readFileSync("app/globals.css", "utf8"),
    fs.readFileSync("app/print-fonts.css", "utf8"),
    fs.readFileSync("components/variants/variants.css", "utf8"),
  ].join("\n");
  assert.match(css, /font-family:\s*"Manrope Variable"/);
  assert.match(css, /font-family:\s*"Manrope"/);
  assert.equal(css.includes('url("/fonts/manrope-latin-wght.woff2")'), true);
  assert.equal(css.includes('url("/fonts/manrope-pl-wght.woff2")'), true);
  assert.match(css, /font-weight:\s*200 800/);
  assert.equal(css.includes("--font-manrope"), false);
  const layout = fs.readFileSync("app/layout.tsx", "utf8");
  assert.equal(GOOGLE_FONT_IMPORT.test(layout), false);
  assert.equal(layout.includes("next/font"), false);
});
