/**
 * Отпечаток содержимого листа для designModified. Fabric после loadFromJSON/toObject
 * дописывает свои поля и абсолютный src, поэтому сравниваем только то, что клиент
 * может поменять в редакторе: тип, текст, картинку, место, размер, поворот, цвет, шрифт.
 */
const areaKeys = ["front", "back", "wrap"] as const;

function round(value: unknown, fallback: number) {
  const number = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return (Math.round(number * 10) / 10).toFixed(1);
}

function srcKey(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  if (value.startsWith("data:")) return `data:${value.length}`;
  try {
    return new URL(value, "http://local").pathname;
  } catch {
    return value;
  }
}

function objectPrint(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const obj = raw as Record<string, unknown>;
  const type = typeof obj.type === "string" ? obj.type.toLowerCase().replace("-", "") : "";
  const children = Array.isArray(obj.objects) ? `[${obj.objects.map(objectPrint).join("|")}]` : "";
  return [
    type,
    typeof obj.text === "string" ? obj.text : "",
    srcKey(obj.src),
    round(obj.left, 0),
    round(obj.top, 0),
    round(obj.scaleX, 1),
    round(obj.scaleY, 1),
    round(obj.angle, 0),
    typeof obj.fontSize === "number" ? round(obj.fontSize, 0) : "",
    typeof obj.fill === "string" ? obj.fill.toLowerCase() : "",
    typeof obj.fontFamily === "string" ? obj.fontFamily : "",
    children,
  ].join(",");
}

function pageObjects(page: unknown): unknown[] {
  if (!page || typeof page !== "object") return [];
  const objects = (page as { objects?: unknown }).objects;
  return Array.isArray(objects) ? objects : [];
}

function fnv1a(text: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function pagesFingerprint(pages: Partial<Record<string, unknown>>) {
  const text = areaKeys
    .map((key) => `${key}:${pageObjects(pages[key]).map(objectPrint).join("|")}`)
    .join("#");
  return `${fnv1a(text)}-${text.length}`;
}

export function usedAreaIds<T extends string>(zones: readonly T[], pages: Partial<Record<string, unknown>>): T[] {
  return zones.filter((id) => pageObjects(pages[id]).length > 0);
}
