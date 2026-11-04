/** Własne naklejki, jeden plik SVG bez zewnętrznych adresów. */

export type Sticker = {
  id: string;
  label: string;
  svg: string;
};

function wrap(body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`;
}

export const stickers: readonly Sticker[] = [
  {
    id: "star",
    label: "Gwiazda",
    svg: wrap(
      `<path fill="#1a1916" d="M32 4 39.5 22.5 59 24.2 44.2 37.2 48.5 56.2 32 46.8 15.5 56.2 19.8 37.2 5 24.2 24.5 22.5Z"/>`,
    ),
  },
  {
    id: "heart",
    label: "Serce",
    svg: wrap(
      `<path fill="#1a1916" d="M32 54s-22-13.2-22-28.2C10 16.2 16.4 10 24 10c4.2 0 7.2 2 8 4.6.8-2.6 3.8-4.6 8-4.6 7.6 0 14 6.2 14 15.8C54 40.8 32 54 32 54Z"/>`,
    ),
  },
  {
    id: "bolt",
    label: "Błyskawica",
    svg: wrap(`<path fill="#1a1916" d="M36 4 14 34h14l-4 26 26-34H36l6-22H36Z"/>`),
  },
  {
    id: "arrow",
    label: "Strzałka",
    svg: wrap(`<path fill="#1a1916" d="M6 26h32V14l20 18-20 18V38H6V26Z"/>`),
  },
  {
    id: "ribbon",
    label: "Wstęga",
    svg: wrap(`<path fill="#1a1916" d="M6 18h46l-8 14 8 14H6l8-14L6 18Z"/>`),
  },
  {
    id: "sun",
    label: "Słońce",
    svg: wrap(
      `<circle cx="32" cy="32" r="12" fill="#1a1916"/><path fill="none" stroke="#1a1916" stroke-width="4" stroke-linecap="round" d="M32 6v8M32 50v8M6 32h8M50 32h8M13.5 13.5l5.6 5.6M44.9 44.9l5.6 5.6M50.5 13.5l-5.6 5.6M19.1 44.9l-5.6 5.6"/>`,
    ),
  },
];

export function stickerById(id: string) {
  return stickers.find((item) => item.id === id) ?? null;
}
