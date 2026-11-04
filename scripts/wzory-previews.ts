/**
 * Рисует прозрачные PNG зон в public/wzory/preview из тех же designState, что откроет редактор.
 * Масштаб — холст редактора (96 dpi), как текстура 3D в редакторе.
 * Запуск: npm run wzory:previews
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { registerFont } from "canvas";
import { printAreaFabricPx } from "@/components/souvenir3d/scale";
import { productById } from "@/lib/catalog";
import { localAssets, normalizeWzor } from "@/lib/wzory/normalize";
import { crmListItem, crmProductLink } from "@/lib/wzory/schema";
import { productFromSlug, type WzorDetail } from "@/lib/wzory/types";

const root = path.join(import.meta.dirname, "..");
const fixtures = path.join(root, "fixtures", "wzory");
const publicDir = path.join(root, "public");
const outDir = path.join(publicDir, "wzory", "preview");

function readJson(file: string) {
  return JSON.parse(readFileSync(file, "utf8")) as unknown;
}

const links = readJson(path.join(fixtures, "produkty.json")) as Record<string, unknown>;
const ready: WzorDetail[] = [];
for (const slug of ["koszulka", "kubek"] as const) {
  const product = productFromSlug(slug)!;
  const link = crmProductLink.parse(links[slug]);
  const items = (readJson(path.join(fixtures, `list-${slug}.json`)) as unknown[]).map((item) => crmListItem.parse(item));
  for (const item of items) {
    const result = normalizeWzor(readJson(path.join(fixtures, "detail", `${item.id}.json`)), {
      product,
      link,
      assets: localAssets,
    });
    if (result.ok) ready.push(result.wzor);
    else console.log(`${item.design_code}: пропущен — ${result.reason}, ${result.detail}`);
  }
}

const registered = new Set<string>();
for (const font of ready.flatMap((wzor) => wzor.fonts)) {
  if (registered.has(font.family)) continue;
  registerFont(path.join(publicDir, font.url), { family: font.family });
  registered.add(font.family);
}

const { StaticCanvas } = await import("fabric/node");

function inlineImages(objects: Record<string, unknown>[]): Record<string, unknown>[] {
  return objects.map((object) => {
    const out = { ...object };
    if (typeof out.src === "string" && out.src.startsWith("/")) {
      const file = path.join(publicDir, out.src);
      const mime = file.endsWith(".png") ? "image/png" : "image/jpeg";
      out.src = `data:${mime};base64,${readFileSync(file).toString("base64")}`;
    }
    if (Array.isArray(out.objects)) out.objects = inlineImages(out.objects as Record<string, unknown>[]);
    return out;
  });
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const wzor of ready) {
  for (const area of wzor.usedPrintAreaIds) {
    const page = wzor.pages[area];
    const zone = productById(wzor.product).zones.find((item) => item.id === area);
    if (!page || !zone) continue;
    const { widthPx, heightPx } = printAreaFabricPx(zone.widthMm, zone.heightMm, 1);
    const canvas = new StaticCanvas(undefined, { width: widthPx, height: heightPx, renderOnAddRemove: false });
    await canvas.loadFromJSON({ ...page, objects: inlineImages(page.objects) });
    canvas.backgroundColor = "";
    canvas.renderAll();
    const file = path.join(outDir, `${wzor.id}-${area}.png`);
    writeFileSync(file, canvas.getNodeCanvas().toBuffer("image/png"));
    canvas.dispose();
    console.log(`${wzor.code} ${area}: ${path.relative(root, file)}`);
  }
}
