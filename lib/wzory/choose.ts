import { productById, type ProductId } from "@/lib/catalog";
import type { PrintAreaId, WorkSnapshot } from "@/lib/work";
import { pagesFingerprint, usedAreaIds } from "@/lib/wzory/fingerprint";
import type { WzorDetail } from "@/lib/wzory/types";

export type ChoiceMode = "as-is" | "edit";

function zoneIds(product: ProductId) {
  return productById(product).zones.map((zone) => zone.id as PrintAreaId);
}

/**
 * Копия master-шаблона в проект клиента. Фон листа — цвет вещи, как в листах самого редактора:
 * loadFromJSON без фона оставил бы лист белым.
 */
export function workWithWzor(work: WorkSnapshot, wzor: WzorDetail, mode: ChoiceMode): WorkSnapshot {
  const pages: Record<string, object> = {};
  for (const [area, page] of Object.entries(wzor.pages)) {
    if (page) pages[area] = { ...page, background: work.color };
  }
  return {
    ...work,
    product: wzor.product,
    zone: wzor.usedPrintAreaIds[0] ?? zoneIds(wzor.product)[0],
    step: mode === "edit" ? "editor" : "shop",
    cartFrom: "shop",
    editorBack: mode === "edit" ? "wzor" : "shop",
    pages,
    previewUrl: null,
    quality: [],
    printFiles: {},
    placed: false,
    order: { ...work.order, consentAt: "" },
    design: {
      templateId: wzor.id,
      code: wzor.code,
      usageFee: wzor.usageFee,
      product: wzor.product,
      fingerprint: pagesFingerprint(pages),
      modified: false,
      fonts: wzor.fonts,
      previews: wzor.previews,
    },
    editorDraftToken: null,
  };
}

/** «Zrób własny»: свой лист остаётся, лист чужого wzoru — нет. */
export function workForOwn(work: WorkSnapshot, product: ProductId): WorkSnapshot {
  const keep = !work.design;
  return {
    ...work,
    product,
    zone: zoneIds(product)[0],
    step: "editor",
    editorBack: "shop",
    pages: keep ? work.pages : {},
    previewUrl: keep ? work.previewUrl : null,
    quality: keep ? work.quality : [],
    printFiles: keep ? work.printFiles : {},
    placed: false,
    order: { ...work.order, consentAt: "" },
    design: null,
    editorDraftToken: keep ? work.editorDraftToken : null,
  };
}

export function withoutDesign(work: WorkSnapshot): WorkSnapshot {
  if (!work.design) return work;
  return { ...work, design: null, pages: {}, previewUrl: null, quality: [], printFiles: {}, editorDraftToken: null };
}

/** На клиенте то же, что делает sanitizeWork при смене вещи. */
export function dropForeignDesign(work: WorkSnapshot): WorkSnapshot {
  if (!work.design || work.design.product === work.product) return work;
  const pages = { ...work.pages };
  for (const key of zoneIds(work.design.product)) delete pages[key];
  return { ...work, design: null, pages, previewUrl: null, editorDraftToken: null };
}

export function usedPrintAreas(work: WorkSnapshot) {
  return usedAreaIds(zoneIds(work.product), work.pages);
}

/** Поля позиции для `items[].params` заказа CRM. */
export function designOrderParams(work: WorkSnapshot) {
  const design = work.design;
  return {
    designTemplateId: design?.templateId ?? null,
    designTemplateCode: design?.code ?? null,
    designUsageFee: design?.usageFee ?? 0,
    designModified: design ? pagesFingerprint(work.pages) !== design.fingerprint : false,
    editorKind: "souvenir_3d" as const,
    editorDraftMode: "souvenir_3d" as const,
    editorDraftToken: work.editorDraftToken,
    activePrintAreaId: work.zone,
    usedPrintAreaIds: usedPrintAreas(work),
  };
}
