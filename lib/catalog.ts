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
    name: "Футболка",
    doorLine: "Грудь и спина · от 5 р.",
    zones: [
      { id: "front", label: "Грудь", widthMm: 300, heightMm: 400 },
      { id: "back", label: "Спина", widthMm: 300, heightMm: 400 },
    ],
  },
  {
    id: "mug",
    name: "Кружка",
    doorLine: "Обхват · от 5 р.",
    zones: [{ id: "wrap", label: "Обхват", widthMm: 200, heightMm: 85 }],
  },
];

export const shirtColors = [
  { id: "black", label: "Чёрный", value: "#171614" },
  { id: "sand", label: "Песочный", value: "#f4f1ea" },
  { id: "wine", label: "Винный", value: "#7d1d1d" },
  { id: "navy", label: "Синий", value: "#1e3a5f" },
] as const;

export const sizes = ["S", "M", "L", "XL"] as const;
export const quantities = ["1", "5", "10", "20"] as const;

export function productById(id: ProductId) {
  return catalog.find((item) => item.id === id) ?? catalog[0];
}
