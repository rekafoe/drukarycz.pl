/**
 * Контракт сувенирного 3D-редактора (майка/кружка).
 * Источник истины для печати — мм; 3D только превью.
 */

export type SouvenirEditorKind = 'flat' | 'souvenir_3d';

export type PrintAreaUvRect = {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
};

/** Зона печати продукта: мм + привязка к GLB mesh/UV. */
export type PrintAreaConfig = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
  /** URL GLB (CDN / uploads). Пусто — процедурная заглушка. */
  modelUrl?: string;
  /** Имя mesh в GLB, куда клеится CanvasTexture (например print_front / print_back). */
  meshName: string;
  /** Подмножество UV, если print не на весь mesh. */
  uvRect?: PrintAreaUvRect;
  /** Тип процедурной заглушки при отсутствии modelUrl. */
  procedural?: 'tshirt' | 'mug';
  /**
   * Кружка: мм от центра ручки (s=0) до начала зоны вдоль обхвата (CCW сверху).
   * Не задано — зона по центру напротив ручки (лицо к камере).
   */
  wrapStartMmFromHandle?: number;
};

export type SouvenirProductMeta = {
  printAreas: PrintAreaConfig[];
  /** Активная зона по умолчанию. */
  defaultPrintAreaId?: string;
};

/** Расширение draft payload / order params. */
export type SouvenirDraftMeta = {
  editorKind: 'souvenir_3d';
  activePrintAreaId?: string;
  usedPrintAreaIds: string[];
};

export type SouvenirSurfacePointer = {
  uv: { u: number; v: number };
  clientX: number;
  clientY: number;
  pointerId: number;
  projectUvToClient?: SouvenirSurfaceProjector;
};

export type SouvenirSurfaceProjector = (
  uv: { u: number; v: number },
) => { x: number; y: number } | null;

export type SouvenirSurfacePointerHandler = (
  phase: 'down' | 'move' | 'up',
  pointer: SouvenirSurfacePointer,
) => boolean;

export type SouvenirLayerItem = {
  id: string;
  kind: SouvenirSelectedObject['kind'];
  label: string;
  selected: boolean;
  thumbSrc?: string;
};

export type SouvenirSelectedObject = {
  kind: 'text' | 'image' | 'other';
  text?: string;
  fill?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  lineHeight?: number;
  cropFit?: 'cover' | 'contain' | null;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
};

export type SouvenirQualityIssue = {
  code: 'low_dpi' | 'out_of_bounds' | 'small_text';
  severity: 'warning' | 'error';
  message: string;
};

export const DEFAULT_TSHIRT_MODEL_URL = '/models/tshirt.glb';
export const DEFAULT_MUG_MODEL_URL = '/models/mug.glb';

export const DEFAULT_PRINT_AREA_TSHIRT: PrintAreaConfig = {
  id: 'front',
  label: 'Грудь',
  widthMm: 300,
  heightMm: 400,
  meshName: 'print_front',
  procedural: 'tshirt',
  modelUrl: DEFAULT_TSHIRT_MODEL_URL,
};

export const DEFAULT_PRINT_AREA_TSHIRT_BACK: PrintAreaConfig = {
  id: 'back',
  label: 'Спина',
  widthMm: 300,
  heightMm: 400,
  meshName: 'print_back',
  procedural: 'tshirt',
  modelUrl: DEFAULT_TSHIRT_MODEL_URL,
};

export const DEFAULT_PRINT_AREAS_TSHIRT: PrintAreaConfig[] = [
  DEFAULT_PRINT_AREA_TSHIRT,
  DEFAULT_PRINT_AREA_TSHIRT_BACK,
];

export const DEFAULT_PRINT_AREA_MUG: PrintAreaConfig = {
  id: 'wrap',
  label: 'Обхват кружки',
  widthMm: 200,
  heightMm: 85,
  meshName: 'print_wrap',
  procedural: 'mug',
  modelUrl: DEFAULT_MUG_MODEL_URL,
};

/** Перед / спина майки по id, meshName или подписи. */
export function isTshirtBackPrintArea(area: Pick<PrintAreaConfig, 'id' | 'meshName' | 'label'>): boolean {
  const key = `${area.id} ${area.meshName} ${area.label}`.toLowerCase();
  return /(?:^|[^a-z])back(?:[^a-z]|$)|rear|print_back|спин|задн/.test(key);
}

export function isMugModelUrl(url?: string | null): boolean {
  return Boolean(url && /mug|кружк/i.test(url));
}

/** Широкая зона (обхват) — типичный wrap кружки, не грудь майки. */
export function isMugWrapAspect(widthMm: number, heightMm: number): boolean {
  return widthMm > 0 && heightMm > 0 && widthMm / heightMm >= 1.55;
}

export function isMugPrintArea(
  area: Pick<PrintAreaConfig, 'id' | 'meshName' | 'label' | 'procedural' | 'modelUrl' | 'widthMm' | 'heightMm'>,
): boolean {
  if (area.procedural === 'mug') return true;
  if (isMugModelUrl(area.modelUrl)) return true;
  const key = `${area.id} ${area.meshName} ${area.label}`.toLowerCase();
  if (/wrap|mug|кружк|обхват/.test(key)) return true;
  // «Грудь» 200×85 на mug.glb — всё равно обхват, не майка.
  if (isMugWrapAspect(area.widthMm, area.heightMm) && !isTshirtBackPrintArea(area)) {
    return true;
  }
  return false;
}

/**
 * Нормализация зон продукта. Количество зон всегда задаёт продукт:
 * односторонний шоппер/майка остаётся однозонным, вторая зона не добавляется неявно.
 */
export function normalizeSouvenirPrintAreas(raw: unknown): PrintAreaConfig[] {
  const parsed = parsePrintAreas(raw);
  if (parsed.length === 0) return [...DEFAULT_PRINT_AREAS_TSHIRT];

  const looksLikeMug =
    parsed.some((a) => isMugPrintArea(a))
    || parsed.some((a) => isMugModelUrl(a.modelUrl))
    || (parsed.length === 1 && isMugWrapAspect(parsed[0]!.widthMm, parsed[0]!.heightMm));

  if (looksLikeMug) {
    return parsed.map((a) => {
      const wrapLabel =
        a.label
        && a.label.trim()
        && !/^(зона\s*\d+|грудь|front)$/i.test(a.label.trim())
          ? a.label
          : 'Обхват кружки';
      return {
        ...a,
        id: /wrap|mug|кружк|обхват/i.test(a.id) ? a.id : 'wrap',
        label: wrapLabel,
        procedural: 'mug' as const,
        meshName: a.meshName && /wrap|mug/i.test(a.meshName) ? a.meshName : 'print_wrap',
        modelUrl: a.modelUrl || DEFAULT_MUG_MODEL_URL,
      };
    });
  }

  const enriched = parsed.map((area, index) => {
    const back =
      isTshirtBackPrintArea(area)
      || (parsed.length >= 2 && index === 1 && !isTshirtBackPrintArea(parsed[0]!));
    return {
      ...area,
      procedural: (area.procedural ?? 'tshirt') as 'tshirt',
      meshName: area.meshName || (back ? 'print_back' : 'print_front'),
      modelUrl: area.modelUrl || DEFAULT_TSHIRT_MODEL_URL,
      label:
        area.label
        && area.label.trim()
        && !/^зона\s*\d+$/i.test(area.label.trim())
          ? area.label
          : back
            ? 'Спина'
            : index === 0
              ? 'Грудь'
              : area.label,
    };
  });

  return enriched;
}

export function parsePrintAreas(raw: unknown): PrintAreaConfig[] {
  if (!Array.isArray(raw)) return [];
  const areas: PrintAreaConfig[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === 'string' ? row.id.trim() : '';
    const widthMm = Number(row.widthMm);
    const heightMm = Number(row.heightMm);
    const meshName = typeof row.meshName === 'string' ? row.meshName.trim() : '';
    if (!id || !meshName || !(widthMm > 0) || !(heightMm > 0)) continue;
    const label = typeof row.label === 'string' && row.label.trim() ? row.label.trim() : id;
    const modelUrl = typeof row.modelUrl === 'string' && row.modelUrl.trim() ? row.modelUrl.trim() : undefined;
    const procedural =
      row.procedural === 'mug' || row.procedural === 'tshirt' ? row.procedural : undefined;
    let uvRect: PrintAreaUvRect | undefined;
    if (row.uvRect && typeof row.uvRect === 'object') {
      const uv = row.uvRect as Record<string, unknown>;
      const u0 = Number(uv.u0);
      const v0 = Number(uv.v0);
      const u1 = Number(uv.u1);
      const v1 = Number(uv.v1);
      if ([u0, v0, u1, v1].every((n) => Number.isFinite(n))) {
        uvRect = { u0, v0, u1, v1 };
      }
    }
    areas.push({
      id,
      label,
      widthMm,
      heightMm,
      meshName,
      modelUrl,
      uvRect,
      procedural,
      ...(Number.isFinite(Number(row.wrapStartMmFromHandle))
        ? { wrapStartMmFromHandle: Number(row.wrapStartMmFromHandle) }
        : {}),
    });
  }
  return areas;
}

export function resolveActivePrintArea(
  areas: PrintAreaConfig[],
  preferredId?: string | null,
): PrintAreaConfig | null {
  if (areas.length === 0) return null;
  if (preferredId) {
    const found = areas.find((a) => a.id === preferredId);
    if (found) return found;
  }
  return areas[0] ?? null;
}
