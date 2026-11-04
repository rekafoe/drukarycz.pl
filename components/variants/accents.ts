import type { CSSProperties } from "react";

/**
 * Акцент плаката. Кнопка на тёмной двери и в нижней панели телефона берёт `ctaDark*`,
 * на светлом фоне — `cta*`. `mark` рисуется на светлом (кольцо цвета, выбранный вариант),
 * `pop` — на тёмном (точка в логотипе).
 */
export type AccentPalette = {
  id: string;
  name: string;
  cta: string;
  ctaHover: string;
  ctaText: string;
  ctaEdge: string;
  ctaDark: string;
  ctaDarkHover: string;
  ctaDarkText: string;
  mark: string;
  pop: string;
  badge: string;
  badgeText: string;
  disc: string;
};

const ink = "#16130F";
const paper = "#F3EEE4";

export const accents = [
  {
    id: "koral",
    name: "Koral",
    cta: "#E23B2F",
    ctaHover: "#CF3127",
    ctaText: "#FFFFFF",
    ctaEdge: "transparent",
    ctaDark: "#E23B2F",
    ctaDarkHover: "#CF3127",
    ctaDarkText: "#FFFFFF",
    mark: "#E23B2F",
    pop: "#E23B2F",
    badge: "#F2C14E",
    badgeText: ink,
    disc: "#C46A4A",
  },
  {
    id: "czerwien",
    name: "Czerwień",
    cta: "#D0101C",
    ctaHover: "#AE0D17",
    ctaText: "#FFFFFF",
    ctaEdge: "transparent",
    ctaDark: "#D0101C",
    ctaDarkHover: "#AE0D17",
    ctaDarkText: "#FFFFFF",
    mark: "#D0101C",
    pop: "#D0101C",
    badge: "#FFD0C7",
    badgeText: ink,
    disc: "#EF6A5E",
  },
  {
    id: "kobalt",
    name: "Kobalt",
    cta: "#2F5BFF",
    ctaHover: "#1F45E0",
    ctaText: "#FFFFFF",
    ctaEdge: "transparent",
    ctaDark: "#2F5BFF",
    ctaDarkHover: "#1F45E0",
    ctaDarkText: "#FFFFFF",
    mark: "#2F5BFF",
    pop: "#2F5BFF",
    badge: "#C9D5FF",
    badgeText: ink,
    disc: "#6F8BFF",
  },
  {
    id: "limonka",
    name: "Limonka",
    cta: "#C6F432",
    ctaHover: "#B2E01C",
    ctaText: ink,
    ctaEdge: ink,
    ctaDark: "#C6F432",
    ctaDarkHover: "#B2E01C",
    ctaDarkText: ink,
    mark: "#5B8C00",
    pop: "#C6F432",
    badge: "#E4FFA0",
    badgeText: ink,
    disc: "#B5E32A",
  },
  {
    id: "zielen",
    name: "Zieleń",
    cta: "#0F7A45",
    ctaHover: "#0B6238",
    ctaText: "#FFFFFF",
    ctaEdge: "transparent",
    ctaDark: "#0F7A45",
    ctaDarkHover: "#0B6238",
    ctaDarkText: "#FFFFFF",
    mark: "#0F7A45",
    pop: "#2FB872",
    badge: "#D3EFDC",
    badgeText: ink,
    disc: "#5E9E7A",
  },
  {
    id: "czern",
    name: "Czerń + pomarańcz",
    cta: ink,
    ctaHover: "#36302A",
    ctaText: "#FFFFFF",
    ctaEdge: "transparent",
    ctaDark: paper,
    ctaDarkHover: "#FFFFFF",
    ctaDarkText: ink,
    mark: "#F04E12",
    pop: "#F04E12",
    badge: "#F04E12",
    badgeText: ink,
    disc: "#F04E12",
  },
] as const satisfies readonly AccentPalette[];

export type AccentId = (typeof accents)[number]["id"];

export const defaultAccent: AccentId = "koral";

export function parseAccent(value: unknown): AccentId {
  return accents.find((item) => item.id === value)?.id ?? defaultAccent;
}

export function accentById(id: AccentId): AccentPalette {
  return accents.find((item) => item.id === id) ?? accents[0];
}

export function accentStyle(id: AccentId): CSSProperties {
  const a = accentById(id);
  return {
    "--a-cta": a.cta,
    "--a-cta-hover": a.ctaHover,
    "--a-cta-text": a.ctaText,
    "--a-cta-edge": a.ctaEdge,
    "--a-cta-glow": `color-mix(in srgb, ${a.cta} 80%, transparent)`,
    "--a-cta-dark": a.ctaDark,
    "--a-cta-dark-hover": a.ctaDarkHover,
    "--a-cta-dark-text": a.ctaDarkText,
    "--a-cta-dark-glow": `color-mix(in srgb, ${a.ctaDark} 80%, transparent)`,
    "--a-mark": a.mark,
    "--a-pop": a.pop,
    "--a-badge": a.badge,
    "--a-badge-text": a.badgeText,
    "--a-disc": a.disc,
  } as CSSProperties;
}
