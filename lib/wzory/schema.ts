import { z } from "zod";

/** Формы ответов CRM2026 `GET /api/design-templates/public*`. Лишние поля CRM отбрасываются. */

function parseJsonString(value: unknown) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

const fee = z.coerce.number().pipe(z.number().finite().min(0));

export const crmListItem = z.object({
  id: z.number().int().positive(),
  design_code: z.string().regex(/^\d{1,12}$/),
  category_id: z.number().int().nullable().optional(),
  site_preview_url: z.string().nullable().optional(),
  preview_url: z.string().nullable().optional(),
  is_active: z.union([z.number(), z.boolean()]).optional(),
  sort_order: z.number().optional(),
  usage_fee: fee.default(0),
  updated_at: z.string().optional(),
  spec: z.string().nullable().optional(),
});

export type CrmListItem = z.infer<typeof crmListItem>;

const fabricObject = z.record(z.string(), z.unknown());

const fabricPage = z.looseObject({
  version: z.string().optional(),
  objects: z.array(fabricObject).default([]),
});

const designPage = z.object({
  fabricJSON: z.preprocess(parseJsonString, fabricPage),
  printAreaId: z.string().min(1).optional(),
  printAreaLabel: z.string().optional(),
  widthMm: z.number().positive().optional(),
  heightMm: z.number().positive().optional(),
});

const editorKind = z.enum(["flat", "souvenir_3d"]);

const designState = z.object({
  templateId: z.number().nullable().optional(),
  pageWidth: z.number().positive(),
  pageHeight: z.number().positive(),
  pageCount: z.number().int().optional(),
  sceneScale: z.number().positive().optional(),
  pages: z.array(designPage).min(1),
  editorKind: editorKind.optional(),
  activePrintAreaId: z.string().optional(),
  usedPrintAreaIds: z.array(z.string()).optional(),
});

const specPrintArea = z.looseObject({
  id: z.string().min(1),
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
});

const requiredFont = z.looseObject({
  family: z.string().min(1),
  url: z.string().min(1),
});

export const crmDetailSpec = z.object({
  width_mm: z.number().positive().optional(),
  height_mm: z.number().positive().optional(),
  page_count: z.number().int().optional(),
  editorKind: editorKind.optional(),
  productId: z.number().int().optional(),
  typeId: z.number().int().optional(),
  sizeId: z.union([z.number(), z.string()]).optional(),
  printAreas: z.array(specPrintArea).optional(),
  /** Предложено в CRM: явные единицы холста. 1 — миллиметры. */
  unitsPerMm: z.number().positive().optional(),
  designState: designState.optional(),
  requiredFonts: z.array(requiredFont).optional(),
  fontsResolved: z.boolean().optional(),
});

export type CrmDetailSpec = z.infer<typeof crmDetailSpec>;
export type CrmDesignState = z.infer<typeof designState>;

export const crmDetail = crmListItem.extend({
  spec: z.preprocess(parseJsonString, crmDetailSpec),
});

export type CrmDetail = z.infer<typeof crmDetail>;

export const crmCategory = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  sort_order: z.number().optional(),
});

/** Связь вещи сайта с товаром CRM. `souvenirBlankTemplateId` CRM кладёт в схему товара. */
export const crmProductLink = z.object({
  productId: z.number().int().positive(),
  typeId: z.number().int().positive(),
  souvenirBlankTemplateId: z.number().int().positive().nullable().default(null),
});

export type CrmProductLink = z.infer<typeof crmProductLink>;
