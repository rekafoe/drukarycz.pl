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
export const quantities = ["1", "5", "10", "20"] as const;

export const finishes = [
  { id: "none", label: "Bez wykończenia" },
  { id: "matte", label: "Matowe" },
  { id: "gloss", label: "Błyszczące" },
] as const;

export function productById(id: ProductId) {
  return catalog.find((item) => item.id === id) ?? catalog[0];
}

/** Адрес лавки вещи. Двери, sitemap и canonical берут его отсюда. */
export const productPaths: Record<ProductId, string> = {
  tshirt: "/koszulka",
  mug: "/kubek",
};
