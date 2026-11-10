import type { Metadata } from "next";
import type { LegalSlug } from "@/components/legal-documents";
import {
  mugCapacityMl,
  productById,
  productPaths,
  shirtColors,
  sizes,
  type ProductId,
} from "@/lib/catalog";
import { getLanding, productGuides, type LandingId } from "@/lib/landings";
import { seller } from "@/lib/seller";
import { absoluteUrl, site } from "@/lib/site";

type PageSeo = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  /** Własny plik opengraph-image w segmencie. Bez tego — wspólna karta głównej. */
  ogImage?: string;
};

const defaultOgImage = { url: "/opengraph-image", width: 1200, height: 630, alt: `${seller.brand} — własny nadruk` };

/** Canonical, hreflang и OG одной страницы. */
export function pageMetadata({ title, description, path, noindex, ogImage }: PageSeo): Metadata {
  const image = ogImage
    ? { url: ogImage, width: 1200, height: 630, alt: title }
    : defaultOgImage;
  return {
    title,
    description,
    alternates: noindex ? undefined : { canonical: path, languages: { pl: path, "x-default": path } },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      siteName: seller.brand,
      locale: site.locale,
      url: path,
      title,
      description,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

const colorList = shirtColors.map((item) => item.label.toLowerCase()).join(", ");

export const homeSeo: PageSeo = {
  title: `Koszulki i kubki z własnym nadrukiem — ${seller.brand}`,
  description: `Zaprojektuj nadruk na koszulce lub kubku w edytorze online i obejrzyj go na modelu 3D. Druk ${seller.cityIn}, gotowe w ${seller.leadTime}. Cena ${seller.priceFrom} brutto.`,
  path: "/",
};

export const productSeo: Record<ProductId, PageSeo & { name: string; summary: string }> = {
  tshirt: {
    name: "Koszulka z własnym nadrukiem",
    title: `Koszulka z własnym nadrukiem, ${seller.priceFrom} — ${seller.brand}`,
    description: `Koszulka z nadrukiem według własnego projektu: przód i tył, rozmiary ${sizes[0]}–${sizes[sizes.length - 1]}, kolory: ${colorList}. Podgląd 3D, druk ${seller.cityIn}, ${seller.priceFrom}.`,
    summary: `Koszulka z nadrukiem według własnego projektu, przód i tył, rozmiary ${sizes.join(", ")}.`,
    path: productPaths.tshirt,
    ogImage: `${productPaths.tshirt}/opengraph-image`,
  },
  mug: {
    name: "Kubek z własnym nadrukiem",
    title: `Kubek z własnym nadrukiem, ${seller.priceFrom} — ${seller.brand}`,
    description: `Kubek ${mugCapacityMl} ml z nadrukiem na obwodzie według własnego projektu. Podgląd 3D w edytorze, druk ${seller.cityIn}, gotowe w ${seller.leadTime}, ${seller.priceFrom}.`,
    summary: `Kubek ${mugCapacityMl} ml z nadrukiem na obwodzie według własnego projektu.`,
    path: productPaths.mug,
    ogImage: `${productPaths.mug}/opengraph-image`,
  },
};

export const wzorySeo: PageSeo = {
  title: `Gotowe wzory — ${seller.brand}`,
  description: `Gotowe wzory na koszulki i kubki. Zamów bez zmian albo zmień tekst i zdjęcie w edytorze. Druk ${seller.cityIn}, ${seller.priceFrom}.`,
  path: "/wzory",
};

export const legalDescriptions: Record<LegalSlug, string> = {
  kontakt: `Dane sprzedawcy ${seller.brand} i sposób kontaktu. Siedziba organizacyjna: ${seller.city}, ${seller.country}.`,
  regulamin: `Regulamin serwisu ${seller.brand}: projekt nadruku, konto, zapis zgłoszenia, cena wyjściowa i prawo polskie.`,
  prywatnosc: `Jakie dane zbiera ${seller.brand}, po co, jak długo je trzymamy i jakie masz prawa według RODO.`,
  cookies: `${seller.brand} używa jednego technicznego ciasteczka sesji. Bez analityki i bez reklam.`,
  odstapienie: `Odstąpienie od umowy w ${seller.brand}, wyjątek dla rzeczy z własnym nadrukiem i wzór formularza.`,
  reklamacje: `Jak złożyć reklamację w ${seller.brand} i w jakim terminie ją rozpatrujemy.`,
  dostawa: `Dostawa po Polsce i płatność w ${seller.brand}. Czas przygotowania druku: ${seller.leadTime}.`,
};

const organizationId = `${site.url}/#organization`;

/** Только заполненные реквизиты из lib/seller.ts. Пустые поля в разметку не попадают. */
export function organizationJsonLd() {
  const address: Record<string, string> = {
    "@type": "PostalAddress",
    addressLocality: seller.city,
    addressCountry: "PL",
  };
  if (seller.street.trim()) address.streetAddress = seller.street.trim();
  if (seller.postalCode.trim()) address.postalCode = seller.postalCode.trim();
  const optional: Record<string, string> = {};
  if (seller.legalName.trim()) optional.legalName = seller.legalName.trim();
  if (seller.email.trim()) optional.email = seller.email.trim();
  if (seller.phone.trim()) optional.telephone = seller.phone.trim();
  if (seller.nip.trim()) optional.taxID = seller.nip.trim();
  return {
    "@type": "Organization",
    "@id": organizationId,
    name: seller.brand,
    url: absoluteUrl("/"),
    address,
    ...optional,
  };
}

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(),
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        name: seller.brand,
        url: absoluteUrl("/"),
        inLanguage: "pl",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "ItemList",
        name: "Produkty z własnym nadrukiem",
        itemListElement: (["tshirt", "mug"] as const).map((id, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: productSeo[id].name,
          url: absoluteUrl(productSeo[id].path),
        })),
      },
    ],
  };
}

function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** Цена та же, что на лавке: стартовая брутто из lib/seller.ts. Наличие не указываем, продажа ещё не открыта. */
export function productJsonLd(id: ProductId) {
  const seo = productSeo[id];
  const url = absoluteUrl(seo.path);
  const product = productById(id);
  const additionalProperty = [
    ...product.zones.map((zone) => ({
      "@type": "PropertyValue",
      name: `Strefa ${zone.label}`,
      value: `${zone.widthMm}×${zone.heightMm} mm`,
    })),
    ...(id === "mug"
      ? [{ "@type": "PropertyValue", name: "Pojemność", value: `${mugCapacityMl} ml` }]
      : [{ "@type": "PropertyValue", name: "Rozmiary", value: sizes.join(", ") }]),
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: seo.name,
        description: seo.summary,
        url,
        image: absoluteUrl(`${seo.path}/opengraph-image`),
        color: shirtColors.map((item) => item.label).join(", "),
        ...(id === "tshirt" ? { size: sizes.join(", ") } : {}),
        additionalProperty,
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "PLN",
          lowPrice: seller.priceFromPln.toFixed(2),
          url,
          seller: { "@id": organizationId },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: seller.brand, item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: seo.name, item: url },
        ],
      },
      faqJsonLd(productGuides[id].faq),
      organizationJsonLd(),
    ],
  };
}

export function landingJsonLd(id: LandingId) {
  const landing = getLanding(id);
  const url = absoluteUrl(landing.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: landing.h1,
        description: landing.description,
        inLanguage: "pl",
        isPartOf: { "@id": `${site.url}/#website` },
        about:
          id === "warszawa"
            ? { "@type": "City", name: seller.city, addressCountry: "PL" }
            : { "@id": `${absoluteUrl(productPaths.tshirt)}#product` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: landing.crumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.label,
          item: absoluteUrl(crumb.href),
        })),
      },
      faqJsonLd(landing.faq),
      organizationJsonLd(),
    ],
  };
}
