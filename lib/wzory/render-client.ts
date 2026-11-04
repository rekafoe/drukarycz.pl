import { StaticCanvas } from "fabric";
import { printAreaFabricPx, productionMultiplier } from "@/components/souvenir3d/scale";
import { productById } from "@/lib/catalog";
import type { PrintAreaId, PrintFiles, WorkSnapshot } from "@/lib/work";

const MAX_PRINT_BYTES = 8_000_000;

/**
 * Тот же растр, что exportProduction редактора: холст зоны на 96 dpi, toCanvasElement с множителем до 300 dpi.
 * Фон листа (цвет вещи) в файл печати не идёт.
 */
async function paintZone(page: object, widthMm: number, heightMm: number, multiplier?: number) {
  const { widthPx, heightPx } = printAreaFabricPx(widthMm, heightMm, 1);
  const { background: _background, ...ink } = page as Record<string, unknown>;
  const off = new StaticCanvas(document.createElement("canvas"), {
    width: widthPx,
    height: heightPx,
    backgroundColor: "",
    renderOnAddRemove: false,
  });
  try {
    await off.loadFromJSON(ink);
    if (off.getObjects().length === 0) return null;
    return off.toCanvasElement(multiplier ?? productionMultiplier(widthPx, widthMm));
  } finally {
    void off.dispose();
  }
}

function toBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), "image/png"));
}

/** «Zamów bez zmian»: PNG зон на 300 dpi в скрытом холсте и запись на свой сервер, без открытия редактора. */
export async function exportTemplatePrints(work: WorkSnapshot) {
  const printFiles: PrintFiles = {};
  let previewUrl: string | null = null;
  let failed = false;
  await fetch("/api/prints", { method: "DELETE" });
  for (const zone of productById(work.product).zones) {
    const page = work.pages[zone.id];
    const objects = (page as { objects?: unknown[] } | undefined)?.objects;
    if (!page || !Array.isArray(objects) || objects.length === 0) continue;
    const painted = await paintZone(page, zone.widthMm, zone.heightMm);
    if (!painted) continue;
    if (!previewUrl) {
      const small = await paintZone(page, zone.widthMm, zone.heightMm, 0.4);
      previewUrl = small?.toDataURL("image/png") ?? null;
    }
    const blob = await toBlob(painted);
    if (!blob || blob.size === 0 || blob.size > MAX_PRINT_BYTES) {
      failed = true;
      continue;
    }
    const response = await fetch(`/api/prints?area=${encodeURIComponent(zone.id)}`, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: blob,
    });
    if (!response.ok) {
      failed = true;
      continue;
    }
    const body = (await response.json()) as { area: PrintAreaId; file: PrintFiles[PrintAreaId] };
    if (body.file) printFiles[body.area] = body.file;
  }
  return { printFiles, previewUrl, failed };
}
