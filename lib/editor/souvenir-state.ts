import { catalog, productById, type ProductId } from "@/lib/catalog";
import type { WorkSnapshot } from "@/lib/work";
import { usedAreaIds } from "@/lib/wzory/fingerprint";

const EMPTY_FABRIC = { version: "7.2.0", objects: [] as unknown[] };

const meshByArea: Record<string, { meshName: string; procedural: "tshirt" | "mug"; modelUrl: string }> = {
  front: { meshName: "print_front", procedural: "tshirt", modelUrl: "/models/tshirt.glb" },
  back: { meshName: "print_back", procedural: "tshirt", modelUrl: "/models/tshirt.glb" },
  wrap: { meshName: "print_wrap", procedural: "mug", modelUrl: "/models/mug.glb" },
};

export type SouvenirPrintArea = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
  meshName: string;
  procedural: "tshirt" | "mug";
  modelUrl: string;
};

export type SouvenirDesignPage = {
  fabricJSON: object;
  printAreaId: string;
  printAreaLabel: string;
  widthMm: number;
  heightMm: number;
};

export type SouvenirDesignState = {
  templateId: number | null;
  pageWidth: number;
  pageHeight: number;
  pageCount: number;
  sceneScale: 1;
  pages: SouvenirDesignPage[];
  editorKind: "souvenir_3d";
  activePrintAreaId: string;
  usedPrintAreaIds: string[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function fabricOf(page: unknown): object {
  const record = asRecord(page);
  if (!record) return { ...EMPTY_FABRIC };
  if (Array.isArray(record.objects)) return record;
  const nested = asRecord(record.fabricJSON);
  if (nested && Array.isArray(nested.objects)) return nested;
  return { ...EMPTY_FABRIC };
}

export function souvenirPrintAreas(product: ProductId): SouvenirPrintArea[] {
  return productById(product).zones.map((zone) => {
    const mesh = meshByArea[zone.id] ?? meshByArea.front;
    return {
      id: zone.id,
      label: zone.label,
      widthMm: zone.widthMm,
      heightMm: zone.heightMm,
      meshName: mesh.meshName,
      procedural: mesh.procedural,
      modelUrl: mesh.modelUrl,
    };
  });
}

export function usedPrintAreaIdsFor(work: Pick<WorkSnapshot, "product" | "pages">) {
  const zones = productById(work.product).zones.map((zone) => zone.id);
  return usedAreaIds(zones, work.pages);
}

export function workHasMaket(work: Pick<WorkSnapshot, "design" | "product" | "pages">) {
  return Boolean(work.design) || usedPrintAreaIdsFor(work).length > 0;
}

export function buildSouvenirDesignState(
  work: Pick<WorkSnapshot, "product" | "zone" | "pages" | "design">,
): SouvenirDesignState {
  const areas = souvenirPrintAreas(work.product);
  const first = areas[0] ?? souvenirPrintAreas("tshirt")[0];
  const pages = areas.map((area) => ({
    fabricJSON: fabricOf(work.pages[area.id]),
    printAreaId: area.id,
    printAreaLabel: area.label,
    widthMm: area.widthMm,
    heightMm: area.heightMm,
  }));
  const allowed = new Set(areas.map((area) => area.id));
  const active = allowed.has(work.zone) ? work.zone : first.id;
  return {
    templateId: work.design?.templateId ?? null,
    pageWidth: first.widthMm,
    pageHeight: first.heightMm,
    pageCount: pages.length,
    sceneScale: 1,
    pages,
    editorKind: "souvenir_3d",
    activePrintAreaId: active,
    usedPrintAreaIds: usedPrintAreaIdsFor(work),
  };
}

export function pagesFromDesignState(state: unknown): Record<string, object> {
  const record = asRecord(state);
  if (!record || !Array.isArray(record.pages)) return {};
  const known = new Set(catalog.flatMap((item) => item.zones.map((zone) => zone.id)));
  const pages: Record<string, object> = {};
  for (const entry of record.pages) {
    const page = asRecord(entry);
    if (!page) continue;
    const areaId = typeof page.printAreaId === "string" ? page.printAreaId : "";
    if (!known.has(areaId) || pages[areaId]) continue;
    pages[areaId] = fabricOf(page.fabricJSON ?? page);
  }
  return pages;
}

export function applyDraftPayload(work: WorkSnapshot, payload: unknown): WorkSnapshot {
  const record = asRecord(payload);
  if (!record) return work;
  const pages = pagesFromDesignState(record.designState ?? record);
  if (Object.keys(pages).length === 0) return work;
  const areas = souvenirPrintAreas(work.product);
  const allowed = new Set(areas.map((area) => area.id));
  const incomingZone = typeof record.activePrintAreaId === "string" ? record.activePrintAreaId : "";
  const zone = allowed.has(incomingZone) ? incomingZone : work.zone;
  return { ...work, pages, zone };
}

export function draftRequestPayload(work: WorkSnapshot) {
  const designState = buildSouvenirDesignState(work);
  return {
    designState,
    editorKind: "souvenir_3d" as const,
    printAreas: souvenirPrintAreas(work.product),
    activePrintAreaId: designState.activePrintAreaId,
    usedPrintAreaIds: designState.usedPrintAreaIds,
    title: work.design ? `Wzór nr ${work.design.code}` : work.product === "mug" ? "Kubek" : "Koszulka",
    productName: work.product === "mug" ? "Kubek" : "Koszulka",
  };
}
