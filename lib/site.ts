/** Адрес сайта и слоты поисковиков. Коды верификации и ключ IndexNow вписывает владелец домена, пустые не выводятся. */
export const site = {
  url: (process.env.SITE_URL || "https://drukarycz.pl").replace(/\/+$/, ""),
  locale: "pl_PL",
  googleVerification: process.env.GOOGLE_SITE_VERIFICATION ?? "",
  bingVerification: process.env.BING_SITE_VERIFICATION ?? "",
  indexNowKey: process.env.INDEXNOW_KEY ?? "",
};

export function absoluteUrl(path: string) {
  return path === "/" ? `${site.url}/` : `${site.url}${path}`;
}
