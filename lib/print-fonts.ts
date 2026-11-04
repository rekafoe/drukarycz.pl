/** Czcionki arkusza. Manrope jest już w layoucie, reszta to lokalne woff2. */

export type PrintFont = {
  id: string;
  label: string;
  family: string;
  /** Osobny plik kursywy. Bez niego przycisk kursywy nic nie narysuje. */
  italic: boolean;
};

export const printFonts: readonly PrintFont[] = [
  { id: "manrope", label: "Manrope", family: "Manrope", italic: false },
  { id: "serif", label: "Source Serif", family: "Source Serif 4", italic: true },
  { id: "oswald", label: "Oswald", family: "Oswald", italic: false },
  { id: "nunito", label: "Nunito", family: "Nunito", italic: true },
  { id: "caveat", label: "Caveat", family: "Caveat", italic: false },
];

export function fontByFamily(family: string): PrintFont {
  const name = family.split(",")[0]?.replace(/["']/g, "").trim().toLowerCase() ?? "";
  return printFonts.find((font) => font.family.toLowerCase() === name) ?? printFonts[0];
}

export function fontById(id: string): PrintFont {
  return printFonts.find((font) => font.id === id) ?? printFonts[0];
}

export function loadPrintFont(family: string, weight: number, italic: boolean) {
  if (typeof document === "undefined") return Promise.resolve();
  const quoted = family.includes(" ") ? `"${family}"` : family;
  const style = italic ? "italic" : "normal";
  return document.fonts.load(`${style} ${weight} 32px ${quoted}`);
}
