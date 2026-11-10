import assert from "node:assert/strict";
import test from "node:test";
import { mugCapacityMl, productPaths, shirtColors, sizes } from "../lib/catalog.ts";
import { allLandings, landingPaths, landingSitemapPaths, productGuides, shopLead } from "../lib/landings.ts";
import { landingJsonLd, productJsonLd, productSeo } from "../lib/seo.ts";
import { site } from "../lib/site.ts";

const ascii = /^[\x20-\x7e]+$/;

function words(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function landingText(id: ReturnType<typeof allLandings>[number]["id"]) {
  const landing = allLandings().find((item) => item.id === id);
  assert.ok(landing);
  return [
    landing.h1,
    landing.lead,
    landing.description,
    ...landing.sections.flatMap((section) => [section.h2, ...section.paragraphs, ...(section.list ?? [])]),
    ...landing.faq.flatMap((item) => [item.q, item.a]),
  ].join(" ");
}

test("canonical i sitemap wskazują www.drukarycz.pl", () => {
  assert.equal(site.url, "https://www.drukarycz.pl");
  const paths = [...Object.values(productPaths), ...landingSitemapPaths()];
  assert.deepEqual(paths.sort(), ["/koszulka", "/koszulka/rozmiary", "/kubek", "/materialy", "/nadruk-warszawa"].sort());
  assert.equal(new Set(paths).size, paths.length);
});

test("każda strona produktowa i landing ma unikalny title, H1 i description", () => {
  const pages = [
    { title: productSeo.tshirt.title, h1: "Koszulka", description: productSeo.tshirt.description },
    { title: productSeo.mug.title, h1: "Kubek", description: productSeo.mug.description },
    ...allLandings().map((item) => ({ title: item.title, h1: item.h1, description: item.description })),
  ];
  assert.equal(new Set(pages.map((item) => item.title)).size, pages.length);
  assert.equal(new Set(pages.map((item) => item.h1)).size, pages.length);
  assert.equal(new Set(pages.map((item) => item.description)).size, pages.length);
});

test("landingi są po polsku, w złotych, z faktami oferty i bez cienkiego tekstu", () => {
  const colorLine = shirtColors.map((item) => item.label).join("|");
  for (const landing of allLandings()) {
    const text = landingText(landing.id);
    assert.ok(words(text) >= 280, `${landing.id} za krótki`);
    assert.match(text, /Warszaw/);
    assert.match(text, /zł|PLN/);
    assert.match(landing.ogTitle, ascii);
    assert.match(landing.ogLine, ascii);
    assert.equal(landing.path, landingPaths[landing.id]);
  }
  const materialy = landingText("materialy");
  assert.match(materialy, new RegExp(colorLine, "i"));
  const rozmiary = landingText("rozmiary");
  for (const size of sizes) assert.match(rozmiary, new RegExp(`\\b${size}\\b`));
  assert.match(landingText("warszawa"), new RegExp(String(mugCapacityMl)));
});

test("opisy ławek powtarzają asortyment, a Product ma PLN", () => {
  assert.match(shopLead("tshirt"), /S, M, L, XL/);
  assert.match(shopLead("mug"), new RegExp(`${mugCapacityMl} ml`));
  for (const id of ["tshirt", "mug"] as const) {
    const data = productJsonLd(id);
    const product = data["@graph"].find((node: { "@type": string }) => node["@type"] === "Product") as {
      offers: { priceCurrency: string };
      name: string;
    };
    assert.equal(product.offers.priceCurrency, "PLN");
    assert.match(product.name, /nadrukiem/);
    const guideWords = words(
      [productGuides[id].intro, ...productGuides[id].sections.flatMap((section) => section.paragraphs)].join(" "),
    );
    assert.ok(guideWords >= 80, `${id} guide`);
  }
});

test("JSON-LD landingu ma FAQ i kanoniczny adres", () => {
  const data = landingJsonLd("warszawa");
  const page = data["@graph"].find((node: { "@type": string }) => node["@type"] === "WebPage") as { url: string };
  assert.equal(page.url, "https://www.drukarycz.pl/nadruk-warszawa");
  const faq = data["@graph"].find((node: { "@type": string }) => node["@type"] === "FAQPage");
  assert.ok(faq);
});

const finishCopy = /wykończen|matowe|błyszczące|szerokości rolki/i;

test("suveniry nie sprzedają wykończenia nadruku", () => {
  for (const landing of allLandings()) {
    const packed = [
      landingText(landing.id),
      landing.title,
      ...landing.crumbs.map((item) => item.label),
      ...landing.ctas.map((item) => item.label),
      ...landing.seeAlso.map((item) => item.label),
    ].join(" ");
    assert.doesNotMatch(packed, finishCopy, landing.id);
  }
  for (const id of ["tshirt", "mug"] as const) {
    const guide = [
      productGuides[id].h2,
      productGuides[id].intro,
      ...productGuides[id].sections.flatMap((section) => [section.h2, ...section.paragraphs]),
      ...productGuides[id].faq.flatMap((item) => [item.q, item.a]),
      ...productGuides[id].seeAlso.map((item) => item.label),
      shopLead(id),
    ].join(" ");
    assert.doesNotMatch(guide, finishCopy, id);
    const product = productJsonLd(id)["@graph"].find((node: { "@type": string }) => node["@type"] === "Product") as {
      additionalProperty: Array<{ name: string; value: string }>;
    };
    assert.ok(!product.additionalProperty.some((item) => finishCopy.test(`${item.name} ${item.value}`)), id);
  }
});
