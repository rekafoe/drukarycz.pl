export type ProductId = "tshirt" | "mug";

export type PrintZone = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
};

export type CatalogProduct = {
  id: ProductId;
  name: string;
  doorLine: string;
  zones: PrintZone[];
};

/** Зоны как в Souvenirs3d: грудь/спина 300×400, обхват кружки 200×85. */
export const catalog: CatalogProduct[] = [
  {
    id: "tshirt",
    name: "Koszulka",
    doorLine: "Przód i tył · od 5 zł",
    zones: [
      { id: "front", label: "Przód", widthMm: 300, heightMm: 400 },
      { id: "back", label: "Tył", widthMm: 300, heightMm: 400 },
    ],
  },
  {
    id: "mug",
    name: "Kubek",
    doorLine: "Obwód · od 5 zł",
    zones: [{ id: "wrap", label: "Obwód", widthMm: 200, heightMm: 85 }],
  },
];

export const shirtColors = [
  { id: "black", label: "Czarny", value: "#171614" },
  { id: "sand", label: "Piaskowy", value: "#f4f1ea" },
  { id: "wine", label: "Bordowy", value: "#7d1d1d" },
  { id: "navy", label: "Granatowy", value: "#1e3a5f" },
] as const;

export const sizes = ["S", "M", "L", "XL"] as const;
/** Opcjonalne skróty nakładu na ławce. Klient może wpisać dowolną liczbę całkowitą ≥ 1. */
export const quantities = ["1", "5", "10", "20"] as const;

/** Pojemność kubka z oferty. Ta sama liczba, którą pokazuje ławka. */
export const mugCapacityMl = 330;

export function productById(id: ProductId) {
  return catalog.find((item) => item.id === id) ?? catalog[0];
}

/** Адрес лавки вещи. Двери, sitemap и canonical берут его отсюда. */
export const productPaths: Record<ProductId, string> = {
  tshirt: "/koszulka",
  mug: "/kubek",
};

/** Адрес листа. Не в sitemap: это рабочий стол, не витрина. */
export const editorPaths: Record<ProductId, string> = {
  tshirt: `${productPaths.tshirt}/maket`,
  mug: `${productPaths.mug}/maket`,
};

const merchDestinations = new Set<string>([...Object.values(productPaths), ...Object.values(editorPaths)]);

/** Ответ «куда идти» с API: только лавка или лист этой вещи, без чужого templateId. */
export function merchDest(path: unknown, fallback: string): string {
  return typeof path === "string" && merchDestinations.has(path) ? path : fallback;
}
