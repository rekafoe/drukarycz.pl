import { printAreaFabricPx } from "@/components/souvenir3d/scale";
import { productById, type PrintZone, type ProductId } from "@/lib/catalog";
import type { PrintAreaId } from "@/lib/work";
import { usedAreaIds } from "@/lib/wzory/fingerprint";
import { crmDetail, type CrmDetailSpec, type CrmDesignState, type CrmProductLink } from "@/lib/wzory/schema";
import type { WzorDetail, WzorFont, WzorRejectReason, WzorResult } from "@/lib/wzory/types";

export const ZONE_TOLERANCE_MM = 1;

const CSS_PX_PER_MM = 96 / 25.4;

/** Холст редактора сайта: SCENE_SCALE = 1, то есть CSS-пиксели при 96 dpi. */
export const SITE_UNITS_PER_MM = printAreaFabricPx(1, 1, 1).pxPerMm;

export type AssetPolicy =
  | { mode: "local"; prefixes: readonly string[] }
  | { mode: "crm"; origin: string };

export const localAssets: AssetPolicy = { mode: "local", prefixes: ["/wzory/", "/fonts/"] };

/** Браузер ходит только на свой сервер: адрес CRM уходит в `/media/crm/*`, чужой адрес — отказ. */
export function rewriteAsset(url: string, policy: AssetPolicy): string | null {
  const value = url.trim();
  if (value.startsWith("data:image/")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) {
    if (policy.mode === "crm") return `/media/crm${value}`;
    return policy.prefixes.some((prefix) => value.startsWith(prefix)) ? value : null;
  }
  if (policy.mode !== "crm") return null;
  try {
    const parsed = new URL(value);
    if (!policy.origin || parsed.origin !== new URL(policy.origin).origin) return null;
    return `/media/crm${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

type FabricObject = Record<string, unknown>;

const textTypes = new Set(["itext", "text", "textbox"]);

function typeKey(object: FabricObject) {
  return typeof object.type === "string" ? object.type.toLowerCase().replace("-", "") : "";
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function r4(value: number) {
  return Math.round(value * 10000) / 10000;
}

function rewriteObjectAssets(object: FabricObject, policy: AssetPolicy): FabricObject | null {
  const out: FabricObject = { ...object };
  if (typeof out.src === "string") {
    const src = rewriteAsset(out.src, policy);
    if (!src) return null;
    out.src = src;
  }
  for (const key of ["fill", "stroke"] as const) {
    const paint = out[key];
    if (paint && typeof paint === "object" && typeof (paint as FabricObject).source === "string") {
      const source = rewriteAsset((paint as FabricObject).source as string, policy);
      if (!source) return null;
      out[key] = { ...(paint as FabricObject), source };
    }
  }
  if (out.clipPath && typeof out.clipPath === "object") {
    const clip = rewriteObjectAssets(out.clipPath as FabricObject, policy);
    if (!clip) return null;
    out.clipPath = clip;
  }
  if (Array.isArray(out.objects)) {
    const children: FabricObject[] = [];
    for (const child of out.objects) {
      if (!child || typeof child !== "object") continue;
      const next = rewriteObjectAssets(child as FabricObject, policy);
      if (!next) return null;
      children.push(next);
    }
    out.objects = children;
  }
  return out;
}

/** Масштаб всей сцены от (0,0). Текст растёт кеглем, чтобы «Rozmiar napisu» в редакторе читал мм. */
function scaleObject(object: FabricObject, factor: number): FabricObject {
  const out: FabricObject = { ...object };
  for (const key of ["left", "top"] as const) {
    const value = num(out[key]);
    if (value !== null) out[key] = r4(value * factor);
  }
  if (textTypes.has(typeKey(out))) {
    const fontSize = num(out.fontSize) ?? 40;
    out.fontSize = r4(fontSize * factor);
    const strokeWidth = num(out.strokeWidth);
    if (strokeWidth !== null) out.strokeWidth = r4(strokeWidth * factor);
    const width = num(out.width);
    if (typeKey(out) === "textbox" && width !== null) out.width = r4(width * factor);
    if (out.shadow && typeof out.shadow === "object") {
      const shadow = { ...(out.shadow as FabricObject) };
      for (const key of ["offsetX", "offsetY", "blur"] as const) {
        const value = num(shadow[key]);
        if (value !== null) shadow[key] = r4(value * factor);
      }
      out.shadow = shadow;
    }
  } else {
    out.scaleX = r4((num(out.scaleX) ?? 1) * factor);
    out.scaleY = r4((num(out.scaleY) ?? 1) * factor);
  }
  const clip = out.clipPath as FabricObject | undefined;
  if (clip && typeof clip === "object" && clip.absolutePositioned === true) out.clipPath = scaleObject(clip, factor);
  return out;
}

function sameMm(a: { widthMm: number; heightMm: number }, zone: PrintZone) {
  return (
    Math.abs(a.widthMm - zone.widthMm) <= ZONE_TOLERANCE_MM && Math.abs(a.heightMm - zone.heightMm) <= ZONE_TOLERANCE_MM
  );
}

function farthest(objects: FabricObject[]) {
  let value = 0;
  for (const object of objects) {
    value = Math.max(value, Math.abs(num(object.left) ?? 0), Math.abs(num(object.top) ?? 0));
  }
  return value;
}

/** Сколько единиц холста шаблона в одном мм. Сувенирный холст CRM — 1 = 1 мм, импорт SVG — пиксели × sceneScale. */
function unitsPerMm(spec: CrmDetailSpec, state: CrmDesignState, mapped: Array<{ zone: PrintZone; objects: FabricObject[] }>) {
  if (spec.unitsPerMm) return { perMm: spec.unitsPerMm, note: null };
  const sceneScale = state.sceneScale ?? 1;
  if (sceneScale !== 1) return { perMm: CSS_PX_PER_MM * sceneScale, note: `пиксели, sceneScale ${sceneScale}` };
  const pixels = mapped.some(({ zone, objects }) => farthest(objects) > Math.max(zone.widthMm, zone.heightMm) * 1.5);
  return pixels ? { perMm: CSS_PX_PER_MM, note: "пиксели без sceneScale" } : { perMm: 1, note: null };
}

function codeOf(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const code = (raw as { design_code?: unknown }).design_code;
  return typeof code === "string" ? code : null;
}

export type NormalizeContext = {
  product: ProductId;
  link: CrmProductLink | null;
  assets: AssetPolicy;
};

export function normalizeWzor(raw: unknown, ctx: NormalizeContext): WzorResult {
  const parsed = crmDetail.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, reason: "schema", detail: `${issue?.path.join(".") ?? ""}: ${issue?.message ?? ""}`, code: codeOf(raw) };
  }
  const item = parsed.data;
  const code = item.design_code;
  const fail = (reason: WzorRejectReason, detail: string): WzorResult => ({ ok: false, reason, detail, code });

  if (item.is_active === 0 || item.is_active === false) return fail("inactive", "шаблон снят с публикации");
  if (ctx.link?.souvenirBlankTemplateId === item.id) return fail("blank", "пустой сувенирный шаблон товара");
  const spec = item.spec;
  const state = spec.designState;
  if (!state) return fail("no_design", "в spec нет designState");
  const kind = spec.editorKind ?? state.editorKind;
  if (kind !== "souvenir_3d") return fail("not_souvenir", `editorKind ${kind ?? "не задан"}`);
  if (
    ctx.link &&
    ((spec.productId !== undefined && spec.productId !== ctx.link.productId) ||
      (spec.typeId !== undefined && spec.typeId !== ctx.link.typeId))
  ) {
    return fail("product", `товар ${spec.productId}/${spec.typeId}, ждём ${ctx.link.productId}/${ctx.link.typeId}`);
  }

  const zones = productById(ctx.product).zones;
  for (const area of spec.printAreas ?? []) {
    const zone = zones.find((item) => item.id === area.id);
    if (!zone) return fail("zone", `зоны ${area.id} нет у вещи`);
    if (!sameMm(area, zone)) {
      return fail("zone", `зона ${area.id} ${area.widthMm}×${area.heightMm} мм, у вещи ${zone.widthMm}×${zone.heightMm} мм`);
    }
  }
  if (state.pages.length > zones.length) return fail("zone", `страниц ${state.pages.length}, зон у вещи ${zones.length}`);

  const warnings: string[] = [];
  const mapped: Array<{ zone: PrintZone; objects: FabricObject[]; version: string }> = [];
  for (const [index, page] of state.pages.entries()) {
    let areaId = page.printAreaId;
    if (!areaId) {
      areaId = zones[index].id;
      warnings.push(`страница ${index + 1} без printAreaId, зона ${areaId} взята по порядку`);
    }
    const zone = zones.find((item) => item.id === areaId);
    if (!zone) return fail("zone", `зоны ${areaId} нет у вещи`);
    if (mapped.some((item) => item.zone.id === zone.id)) return fail("zone", `зона ${zone.id} занята дважды`);
    const size = { widthMm: page.widthMm ?? state.pageWidth, heightMm: page.heightMm ?? state.pageHeight };
    if (!sameMm(size, zone)) {
      return fail("zone", `страница ${zone.id} ${size.widthMm}×${size.heightMm} мм, у вещи ${zone.widthMm}×${zone.heightMm} мм`);
    }
    mapped.push({ zone, objects: page.fabricJSON.objects, version: page.fabricJSON.version ?? "7.2.0" });
  }

  const units = unitsPerMm(spec, state, mapped);
  if (units.note) warnings.push(`единицы: ${units.note}, пересчитано через мм`);
  const factor = SITE_UNITS_PER_MM / units.perMm;
  const pages: WzorDetail["pages"] = {};
  for (const { zone, objects, version } of mapped) {
    const out: FabricObject[] = [];
    for (const object of objects) {
      const withAssets = rewriteObjectAssets(object, ctx.assets);
      if (!withAssets) return fail("asset", "картинка не со своего сервера и не из CRM");
      out.push(scaleObject(withAssets, factor));
    }
    pages[zone.id as PrintAreaId] = { version, objects: out };
  }
  const used = usedAreaIds(zones.map((zone) => zone.id as PrintAreaId), pages);
  if (used.length === 0) return fail("empty", "на зонах нет объектов");

  const fonts: WzorFont[] = [];
  let fontsOk = spec.fontsResolved !== false;
  if (!fontsOk) warnings.push("CRM не нашла все шрифты");
  for (const font of spec.requiredFonts ?? []) {
    const url = rewriteAsset(font.url, ctx.assets);
    if (!url) {
      fontsOk = false;
      warnings.push(`шрифт ${font.family} не со своего сервера, пропущен`);
      continue;
    }
    fonts.push({ family: font.family, url });
  }

  const image =
    [item.site_preview_url, item.preview_url]
      .map((url) => (url ? rewriteAsset(url, ctx.assets) : null))
      .find((url): url is string => Boolean(url)) ?? null;

  return {
    ok: true,
    wzor: {
      id: item.id,
      code,
      product: ctx.product,
      categoryId: item.category_id ?? null,
      usageFee: Math.round(item.usage_fee * 100) / 100,
      usedPrintAreaIds: used,
      previews: {},
      image,
      pages,
      fonts,
      asIs: fontsOk,
      warnings,
      updatedAt: item.updated_at ?? "",
    },
  };
}
