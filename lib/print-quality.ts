import { printAreaFabricPx } from "@/components/souvenir3d/scale";
import type { QualityIssue } from "@/lib/work";

export const MIN_TEXT_MM = 5;
export const SAFE_MARGIN_MM = 5;
export const PRINT_DPI = 300;

const CSS_DPI = 96;

type OriginX = "left" | "center" | "right";
type OriginY = "top" | "center" | "bottom";

type Measured = {
  kind: "text" | "image" | "other";
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  originX: OriginX;
  originY: OriginY;
  fontSize: number;
};

function num(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function scaleOf(value: unknown) {
  const scale = num(value, 1);
  return scale === 0 ? 1 : scale;
}

function originX(value: unknown): OriginX {
  return value === "center" || value === "right" ? value : "left";
}

function originY(value: unknown): OriginY {
  return value === "center" || value === "bottom" ? value : "top";
}

function kindOf(type: unknown): Measured["kind"] {
  const name = typeof type === "string" ? type.toLowerCase().replace("-", "") : "";
  if (name === "image" || name === "fabricimage") return "image";
  if (name === "itext" || name === "text" || name === "textbox") return "text";
  return "other";
}

export function measureObject(raw: unknown): Measured | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const width = num(obj.width, 0);
  const height = num(obj.height, 0);
  if (width <= 0 || height <= 0) return null;
  return {
    kind: kindOf(obj.type),
    left: num(obj.left, 0),
    top: num(obj.top, 0),
    width,
    height,
    scaleX: scaleOf(obj.scaleX),
    scaleY: scaleOf(obj.scaleY),
    angle: num(obj.angle, 0),
    originX: originX(obj.originX),
    originY: originY(obj.originY),
    fontSize: num(obj.fontSize, 0),
  };
}

function corners(object: Measured): Array<[number, number]> {
  const w = object.width * object.scaleX;
  const h = object.height * object.scaleY;
  const ox = object.originX === "center" ? w / 2 : object.originX === "right" ? w : 0;
  const oy = object.originY === "center" ? h / 2 : object.originY === "bottom" ? h : 0;
  const rad = (object.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    [-ox, -oy],
    [w - ox, -oy],
    [w - ox, h - oy],
    [-ox, h - oy],
  ].map(([x, y]) => [object.left + x * cos - y * sin, object.top + x * sin + y * cos]);
}

function outside(object: Measured, widthPx: number, heightPx: number) {
  const slack = 2;
  return corners(object).some(([x, y]) => x < -slack || y < -slack || x > widthPx + slack || y > heightPx + slack);
}

/** Худшая ось: dpi = пиксели файла / дюймы на листе. */
export function imageDpi(object: Measured) {
  const dpiX = (CSS_DPI * object.width) / (object.width * Math.abs(object.scaleX));
  const dpiY = (CSS_DPI * object.height) / (object.height * Math.abs(object.scaleY));
  return Math.min(dpiX, dpiY);
}

export function textHeightMm(object: Measured) {
  return (object.fontSize * Math.abs(object.scaleY) * 25.4) / CSS_DPI;
}

function pageObjects(page: unknown): unknown[] {
  if (!page || typeof page !== "object") return [];
  const objects = (page as { objects?: unknown }).objects;
  return Array.isArray(objects) ? objects : [];
}

export function issuesForArea(
  area: { id: string; label: string; widthMm: number; heightMm: number },
  page: unknown,
): QualityIssue[] {
  const { widthPx, heightPx } = printAreaFabricPx(area.widthMm, area.heightMm, 1);
  const objects = pageObjects(page).map(measureObject).filter((item): item is Measured => item !== null);
  const issues: QualityIssue[] = [];
  if (objects.some((object) => outside(object, widthPx, heightPx))) {
    issues.push({
      code: "out_of_bounds",
      severity: "error",
      areaId: area.id,
      message: `Element wychodzi poza strefę ${area.label}.`,
    });
  }
  const images = objects.filter((object) => object.kind === "image");
  if (images.length > 0) {
    const dpi = Math.round(Math.min(...images.map(imageDpi)));
    if (dpi < PRINT_DPI) {
      issues.push({
        code: "low_dpi",
        severity: "warning",
        areaId: area.id,
        message: `Zdjęcie na strefie ${area.label} ma około ${Math.max(dpi, 1)} dpi. Do druku trzeba 300.`,
      });
    }
  }
  const texts = objects.filter((object) => object.kind === "text" && object.fontSize > 0);
  if (texts.some((object) => textHeightMm(object) < MIN_TEXT_MM - 0.05)) {
    issues.push({
      code: "small_text",
      severity: "warning",
      areaId: area.id,
      message: `Napis na strefie ${area.label} jest mniejszy niż 5 mm.`,
    });
  }
  return issues;
}

export function issuesForAreas(
  areas: Array<{ id: string; label: string; widthMm: number; heightMm: number }>,
  pages: Record<string, object>,
): QualityIssue[] {
  return areas.flatMap((area) => issuesForArea(area, pages[area.id]));
}
