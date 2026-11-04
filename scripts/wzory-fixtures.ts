/**
 * Собирает fixtures/wzory в форме ответов CRM2026 `GET /api/design-templates/public*`.
 * Координаты — 1 единица = 1 мм, `sceneScale: 1`; шаблон 104 — пиксели со `sceneScale: 3`, как из импорта SVG.
 * Запуск: npm run wzory:fixtures
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createCanvas } from "canvas";

const root = path.join(import.meta.dirname, "..");
const outDir = path.join(root, "fixtures", "wzory");
const photoFile = path.join(root, "public", "wzory", "img", "zachod-slonca.jpg");
const PHOTO_PX = 2560;
const PX_PER_MM_SCALE3 = (96 / 25.4) * 3;

type Obj = Record<string, unknown>;
type Area = "front" | "back" | "wrap";
type Product = "koszulka" | "kubek";

const products = {
  koszulka: { productId: 501, typeId: 1, sizeId: 11, souvenirBlankTemplateId: 100 },
  kubek: { productId: 502, typeId: 1, sizeId: 21, souvenirBlankTemplateId: 200 },
} as const;

const printAreas = {
  koszulka: [
    { id: "front", label: "Przód", widthMm: 300, heightMm: 400, meshName: "print_front", procedural: "tshirt" },
    { id: "back", label: "Tył", widthMm: 300, heightMm: 400, meshName: "print_back", procedural: "tshirt" },
  ],
  kubek: [{ id: "wrap", label: "Obwód", widthMm: 200, heightMm: 85, meshName: "print_wrap", procedural: "mug" }],
};

const categories = [
  { id: 1, name: "Urodziny", sort_order: 1 },
  { id: 2, name: "Śmieszne", sort_order: 2 },
  { id: 3, name: "Zwierzęta", sort_order: 3 },
  { id: 4, name: "Imiona", sort_order: 4 },
  { id: 5, name: "Sport", sort_order: 5 },
];

const fonts = {
  archivo: { id: 1, family: "Archivo Black", url: "/fonts/wzory/ArchivoBlack-Regular.ttf" },
  caveat: { id: 2, family: "Caveat", url: "/fonts/wzory/Caveat.ttf" },
};

const ink = { mustard: "#f2c14e", cream: "#fffaf0", coral: "#e4572e", pink: "#ff8fab", dark: "#1a1916" };

function text(value: string, o: { x: number; y: number; size: number; font: "archivo" | "caveat"; fill: string; width: number; spacing?: number; angle?: number }): Obj {
  return {
    type: "Textbox",
    version: "7.2.0",
    originX: "center",
    originY: "center",
    left: o.x,
    top: o.y,
    width: o.width,
    text: value,
    fontSize: o.size,
    fontFamily: fonts[o.font].family,
    fontWeight: "normal",
    fill: o.fill,
    textAlign: "center",
    lineHeight: 1.05,
    charSpacing: o.spacing ?? 0,
    angle: o.angle ?? 0,
    scaleX: 1,
    scaleY: 1,
  };
}

/** Иконки нарисованы в квадрате 100×100. */
const icons = {
  star: "M50 4 L61 38 L97 38 L68 59 L79 93 L50 72 L21 93 L32 59 L3 38 L39 38 Z",
  heart: "M50 92 C22 72 4 56 4 34 C4 18 16 6 31 6 C40 6 46 11 50 18 C54 11 60 6 69 6 C84 6 96 18 96 34 C96 56 78 72 50 92 Z",
  cat:
    "M14 30 L22 4 L40 22 C46 20 54 20 60 22 L78 4 L86 30 C92 40 94 50 94 58 C94 80 74 96 50 96 C26 96 6 80 6 58 C6 50 8 40 14 30 Z " +
    "M29 54 C29 47 41 47 41 54 C41 61 29 61 29 54 Z M59 54 C59 47 71 47 71 54 C71 61 59 61 59 54 Z M44 68 L56 68 L50 75 Z",
  cup:
    "M14 40 H70 V60 C70 78 58 88 42 88 C26 88 14 78 14 60 Z M70 45 C90 45 90 73 70 73 L70 65 C80 65 80 53 70 53 Z " +
    "M6 92 H78 C78 96 74 99 70 99 H14 C10 99 6 96 6 92 Z",
  steam: "M30 32 C24 24 36 18 30 6 M42 32 C36 24 48 18 42 6 M54 32 C48 24 60 18 54 6",
};

function icon(name: keyof typeof icons, o: { x: number; y: number; size: number; fill?: string; stroke?: string; strokeWidth?: number }): Obj {
  const scale = o.size / 100;
  return {
    type: "Path",
    version: "7.2.0",
    originX: "center",
    originY: "center",
    left: o.x,
    top: o.y,
    path: icons[name],
    fill: o.fill ?? "",
    stroke: o.stroke ?? null,
    strokeWidth: o.strokeWidth ?? 0,
    strokeLineCap: "round",
    fillRule: "evenodd",
    scaleX: scale,
    scaleY: scale,
  };
}

function rect(o: { x: number; y: number; width: number; height: number; fill: string; rx?: number; angle?: number }): Obj {
  return {
    type: "Rect",
    version: "7.2.0",
    originX: "center",
    originY: "center",
    left: o.x,
    top: o.y,
    width: o.width,
    height: o.height,
    rx: o.rx ?? 0,
    ry: o.rx ?? 0,
    fill: o.fill,
    angle: o.angle ?? 0,
    scaleX: 1,
    scaleY: 1,
  };
}

function circle(o: { x: number; y: number; r: number; fill: string }): Obj {
  return { type: "Circle", version: "7.2.0", originX: "center", originY: "center", left: o.x, top: o.y, radius: o.r, fill: o.fill, scaleX: 1, scaleY: 1 };
}

function photo(o: { x: number; y: number; widthMm: number; angle?: number }): Obj {
  const scale = o.widthMm / PHOTO_PX;
  return {
    type: "Image",
    version: "7.2.0",
    originX: "center",
    originY: "center",
    left: o.x,
    top: o.y,
    width: PHOTO_PX,
    height: PHOTO_PX,
    src: "/wzory/img/zachod-slonca.jpg",
    crossOrigin: null,
    angle: o.angle ?? 0,
    scaleX: scale,
    scaleY: scale,
  };
}

/** Перевод мм-объекта в пиксели импорта CRM: мм × 96/25,4 × sceneScale. */
function toPx(object: Obj): Obj {
  const k = PX_PER_MM_SCALE3;
  const out: Obj = { ...object, left: (object.left as number) * k, top: (object.top as number) * k };
  if (out.type === "Textbox") return { ...out, fontSize: (object.fontSize as number) * k, width: (object.width as number) * k };
  return { ...out, scaleX: ((object.scaleX as number) ?? 1) * k, scaleY: ((object.scaleY as number) ?? 1) * k };
}

type Design = {
  id: number;
  code: string;
  product: Product;
  name: string;
  categoryId: number | null;
  fee: number;
  sort: number;
  pages: Partial<Record<Area, Obj[]>>;
  fonts: Array<keyof typeof fonts>;
  sceneScale?: number;
  editorKind?: "souvenir_3d" | "flat";
  areas?: Array<Record<string, unknown>>;
  page?: { widthMm: number; heightMm: number };
  noAreaIds?: boolean;
};

const designs: Design[] = [
  {
    id: 100,
    code: "000100",
    product: "koszulka",
    name: "Футболка — пустой шаблон",
    categoryId: null,
    fee: 0,
    sort: 0,
    fonts: [],
    pages: { front: [], back: [] },
  },
  {
    id: 101,
    code: "000101",
    product: "koszulka",
    name: "Сначала кофе",
    categoryId: 2,
    fee: 5,
    sort: 1,
    fonts: ["archivo", "caveat"],
    pages: {
      front: [
        text("NAJPIERW", { x: 150, y: 80, size: 40, font: "archivo", fill: ink.mustard, width: 290, spacing: 40 }),
        text("KAWA", { x: 150, y: 140, size: 88, font: "archivo", fill: ink.mustard, width: 290 }),
        text("potem rozmowy", { x: 150, y: 205, size: 46, font: "caveat", fill: ink.cream, width: 290 }),
      ],
      back: [],
    },
  },
  {
    id: 102,
    code: "000102",
    product: "koszulka",
    name: "Команда, номер на спине",
    categoryId: 5,
    fee: 8,
    sort: 2,
    fonts: ["archivo"],
    pages: {
      front: [
        circle({ x: 215, y: 70, r: 34, fill: ink.coral }),
        icon("star", { x: 215, y: 69, size: 42, fill: ink.cream }),
        text("DRUŻYNA", { x: 215, y: 122, size: 12, font: "archivo", fill: ink.cream, width: 110, spacing: 120 }),
      ],
      back: [
        text("NOWAK", { x: 150, y: 60, size: 54, font: "archivo", fill: ink.cream, width: 290, spacing: 60 }),
        text("10", { x: 150, y: 210, size: 200, font: "archivo", fill: ink.coral, width: 290 }),
      ],
    },
  },
  {
    id: 103,
    code: "000103",
    product: "koszulka",
    name: "Фото в рамке, день рождения мамы",
    categoryId: 1,
    fee: 7,
    sort: 3,
    fonts: ["archivo", "caveat"],
    pages: {
      front: [
        rect({ x: 150, y: 175, width: 236, height: 280, fill: ink.cream, rx: 2 }),
        photo({ x: 150, y: 160, widthMm: 212 }),
        text("Sto lat, Mamo!", { x: 150, y: 291, size: 38, font: "caveat", fill: ink.dark, width: 220 }),
        text("URODZINY · 2026", { x: 150, y: 345, size: 14, font: "archivo", fill: ink.cream, width: 280, spacing: 120 }),
      ],
      back: [],
    },
  },
  {
    id: 104,
    code: "000104",
    product: "koszulka",
    name: "Кот (импорт SVG, пиксели)",
    categoryId: 3,
    fee: 5,
    sort: 4,
    fonts: ["archivo"],
    sceneScale: 3,
    pages: {
      front: [
        icon("cat", { x: 150, y: 95, size: 110, fill: ink.mustard }),
        text("MAM KOTA.", { x: 150, y: 205, size: 40, font: "archivo", fill: ink.mustard, width: 290 }),
        text("KOT MA MNIE.", { x: 150, y: 252, size: 30, font: "archivo", fill: ink.cream, width: 290 }),
      ].map(toPx),
      back: [],
    },
  },
  {
    id: 105,
    code: "000105",
    product: "koszulka",
    name: "Имя Оля",
    categoryId: 4,
    fee: 0,
    sort: 5,
    fonts: ["caveat"],
    pages: {
      front: [
        icon("heart", { x: 150, y: 70, size: 50, fill: ink.pink }),
        text("Ola", { x: 150, y: 160, size: 150, font: "caveat", fill: ink.pink, width: 290 }),
        text("najlepsza siostra na świecie", { x: 150, y: 255, size: 34, font: "caveat", fill: ink.cream, width: 280 }),
      ],
      back: [],
    },
  },
  {
    id: 902,
    code: "000902",
    product: "koszulka",
    name: "Плоский макет без зон (ошибка)",
    categoryId: 2,
    fee: 5,
    sort: 9,
    fonts: ["archivo"],
    sceneScale: 3,
    editorKind: "flat",
    noAreaIds: true,
    pages: { front: [text("WAKACJE 2026", { x: 150, y: 120, size: 32, font: "archivo", fill: ink.cream, width: 290 })].map(toPx) },
  },
  {
    id: 200,
    code: "000200",
    product: "kubek",
    name: "Кружка — пустой шаблон",
    categoryId: null,
    fee: 0,
    sort: 0,
    fonts: [],
    pages: { wrap: [] },
  },
  {
    id: 201,
    code: "000201",
    product: "kubek",
    name: "Не говорю до кофе",
    categoryId: 2,
    fee: 4,
    sort: 1,
    fonts: ["archivo", "caveat"],
    pages: {
      wrap: [
        text("NIE GADAM PRZED KAWĄ", { x: 100, y: 31, size: 11.5, font: "archivo", fill: ink.mustard, width: 104 }),
        text("serio, poczekaj chwilę", { x: 100, y: 60, size: 12, font: "caveat", fill: ink.cream, width: 120 }),
      ],
    },
  },
  {
    id: 202,
    code: "000202",
    product: "kubek",
    name: "Коты с двух сторон",
    categoryId: 3,
    fee: 6,
    sort: 2,
    fonts: ["caveat"],
    pages: {
      wrap: [
        icon("cat", { x: 74, y: 36, size: 44, fill: ink.mustard }),
        text("miau", { x: 74, y: 70, size: 15, font: "caveat", fill: ink.cream, width: 50 }),
        icon("cat", { x: 126, y: 36, size: 44, fill: ink.pink }),
        text("mrrr", { x: 126, y: 70, size: 15, font: "caveat", fill: ink.cream, width: 50 }),
      ],
    },
  },
  {
    id: 203,
    code: "000203",
    product: "kubek",
    name: "Имя и дата",
    categoryId: 4,
    fee: 5,
    sort: 3,
    fonts: ["archivo", "caveat"],
    pages: {
      wrap: [
        icon("heart", { x: 34, y: 38, size: 14, fill: ink.pink }),
        text("Kasia", { x: 100, y: 36, size: 44, font: "caveat", fill: ink.pink, width: 120 }),
        icon("heart", { x: 166, y: 38, size: 14, fill: ink.pink }),
        text("12.05.2026", { x: 100, y: 66, size: 9, font: "archivo", fill: ink.cream, width: 150, spacing: 200 }),
      ],
    },
  },
  {
    id: 901,
    code: "000901",
    product: "kubek",
    name: "Кружка 210×95 (ошибка)",
    categoryId: 2,
    fee: 4,
    sort: 9,
    fonts: ["archivo"],
    areas: [{ id: "wrap", label: "Обхват кружки", widthMm: 210, heightMm: 95, meshName: "print_wrap", procedural: "mug" }],
    page: { widthMm: 210, heightMm: 95 },
    pages: { wrap: [text("KAWA TO ŻYCIE", { x: 105, y: 47, size: 16, font: "archivo", fill: ink.mustard, width: 200 })] },
  },
];

function designState(design: Design) {
  const zones = design.areas ?? printAreas[design.product];
  const size = design.page ?? { widthMm: zones[0].widthMm as number, heightMm: zones[0].heightMm as number };
  const pages = (Object.entries(design.pages) as Array<[Area, Obj[]]>).map(([area, objects]) => ({
    fabricJSON: { version: "7.2.0", objects },
    ...(design.noAreaIds
      ? {}
      : {
          printAreaId: area,
          printAreaLabel: zones.find((zone) => zone.id === area)?.label,
          widthMm: size.widthMm,
          heightMm: size.heightMm,
        }),
  }));
  return {
    templateId: design.id,
    pageWidth: size.widthMm,
    pageHeight: size.heightMm,
    pageCount: pages.length,
    sceneScale: design.sceneScale ?? 1,
    pages,
    ...(design.editorKind === "flat" ? {} : { editorKind: "souvenir_3d", activePrintAreaId: pages[0]?.printAreaId }),
  };
}

function lightSpec(design: Design) {
  const product = products[design.product];
  const zones = design.areas ?? printAreas[design.product];
  return {
    productId: product.productId,
    typeId: product.typeId,
    sizeId: product.sizeId,
    width_mm: design.page?.widthMm ?? zones[0].widthMm,
    height_mm: design.page?.heightMm ?? zones[0].heightMm,
    page_count: Object.keys(design.pages).length,
    import: { status: "none" },
  };
}

function previewOf(design: Design) {
  const first = (Object.entries(design.pages) as Array<[Area, Obj[]]>).find(([, objects]) => objects.length > 0);
  return first ? `/wzory/preview/${design.id}-${first[0]}.png` : null;
}

function listItem(design: Design) {
  const product = products[design.product];
  return {
    id: design.id,
    design_code: design.code,
    name: design.name,
    description: null,
    category_id: design.categoryId,
    category: categories.find((item) => item.id === design.categoryId)?.name ?? null,
    preview_url: null,
    site_preview_url: previewOf(design),
    spec: JSON.stringify(lightSpec(design)),
    is_active: 1,
    sort_order: design.sort,
    usage_fee: design.fee,
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: "2026-11-04T12:00:00.000Z",
    available_size_ids: [product.sizeId],
    variant_by_size: { [String(product.sizeId)]: design.id },
  };
}

function detail(design: Design) {
  const zones = design.areas ?? printAreas[design.product];
  const spec = {
    ...lightSpec(design),
    editorKind: design.editorKind ?? "souvenir_3d",
    ...(design.editorKind === "flat" ? {} : { printAreas: zones }),
    designState: designState(design),
    requiredFonts: design.fonts.map((key) => fonts[key]),
    fontsResolved: true,
  };
  return { ...listItem(design), spec: JSON.stringify(spec) };
}

/** Заглушка «фото» для шаблона с рамкой: закат над озером, 2560 px — 300 dpi на 212 мм. */
function paintPhoto() {
  const size = PHOTO_PX;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const sky = ctx.createLinearGradient(0, 0, 0, size * 0.62);
  sky.addColorStop(0, "#27325f");
  sky.addColorStop(0.45, "#a04f6c");
  sky.addColorStop(0.8, "#f08a4b");
  sky.addColorStop(1, "#ffc773");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, size, size * 0.62);
  const sunX = size * 0.62;
  const sunY = size * 0.55;
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, size * 0.36);
  glow.addColorStop(0, "rgba(255,236,170,0.95)");
  glow.addColorStop(0.18, "rgba(255,206,120,0.55)");
  glow.addColorStop(1, "rgba(255,160,90,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size * 0.62);
  ctx.fillStyle = "#fff1c7";
  ctx.beginPath();
  ctx.arc(sunX, sunY, size * 0.075, 0, Math.PI * 2);
  ctx.fill();
  const ridge = (base: number, amp: number, color: string, seed: number) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.62);
    for (let x = 0; x <= size; x += size / 64) {
      const t = x / size;
      const y = base - amp * (0.55 * Math.sin(t * 5.1 + seed) + 0.3 * Math.sin(t * 11.7 + seed * 2) + 0.15 * Math.sin(t * 23 + seed * 3));
      ctx.lineTo(x, size * y);
    }
    ctx.lineTo(size, size * 0.62);
    ctx.closePath();
    ctx.fill();
  };
  ridge(0.5, 0.07, "#6b3f63", 0.4);
  ridge(0.56, 0.05, "#3f2c4f", 1.7);
  ridge(0.6, 0.025, "#24203a", 2.9);
  const water = ctx.createLinearGradient(0, size * 0.62, 0, size);
  water.addColorStop(0, "#f2a061");
  water.addColorStop(0.25, "#9a5672");
  water.addColorStop(1, "#1f2547");
  ctx.fillStyle = water;
  ctx.fillRect(0, size * 0.62, size, size * 0.38);
  for (let row = 0; row < 90; row += 1) {
    const y = size * 0.625 + row * row * 0.12 + row * 6;
    if (y > size) break;
    const spread = 0.05 + row * 0.004;
    const width = size * spread * (0.6 + 0.4 * Math.sin(row * 1.7));
    ctx.fillStyle = `rgba(255,226,160,${Math.max(0.05, 0.55 - row * 0.008)})`;
    ctx.fillRect(sunX - width / 2 + Math.sin(row * 2.3) * 40, y, width, 4 + row * 0.12);
  }
  ctx.strokeStyle = "rgba(30,24,44,0.85)";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  for (const [bx, by, s] of [
    [0.26, 0.22, 1],
    [0.33, 0.27, 0.75],
    [0.21, 0.3, 0.6],
  ] as const) {
    const x = size * bx;
    const y = size * by;
    const w = 70 * s;
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x - w / 2, y - w * 0.5, x, y);
    ctx.quadraticCurveTo(x + w / 2, y - w * 0.5, x + w, y);
    ctx.stroke();
  }
  mkdirSync(path.dirname(photoFile), { recursive: true });
  writeFileSync(photoFile, canvas.toBuffer("image/jpeg", { quality: 0.86 }));
}

function writeJson(file: string, value: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

rmSync(path.join(outDir, "detail"), { recursive: true, force: true });
writeJson(path.join(outDir, "kategorie.json"), categories);
writeJson(
  path.join(outDir, "produkty.json"),
  Object.fromEntries(
    (Object.keys(products) as Product[]).map((key) => [
      key,
      { productId: products[key].productId, typeId: products[key].typeId, souvenirBlankTemplateId: products[key].souvenirBlankTemplateId },
    ]),
  ),
);
for (const product of Object.keys(products) as Product[]) {
  const own = designs.filter((design) => design.product === product).sort((a, b) => a.sort - b.sort);
  writeJson(path.join(outDir, `list-${product}.json`), own.map(listItem));
}
for (const design of designs) writeJson(path.join(outDir, "detail", `${design.id}.json`), detail(design));
paintPhoto();
console.log(`fixtures/wzory: ${designs.length} шаблонов, фото ${path.relative(root, photoFile)}`);
