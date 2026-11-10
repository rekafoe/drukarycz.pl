import {
  mugCapacityMl,
  productById,
  productPaths,
  shirtColors,
  sizes,
  type ProductId,
} from "@/lib/catalog";
import { seller } from "@/lib/seller";

export type LandingId = "warszawa" | "rozmiary" | "materialy";

export type LandingFaq = { q: string; a: string };

export type LandingSection = {
  h2: string;
  paragraphs: string[];
  list?: string[];
};

export type LandingCta = { href: string; label: string; primary?: boolean };

export type LandingPage = {
  id: LandingId;
  path: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  kicker: string;
  ogTitle: string;
  ogLine: string;
  ogImage: string;
  ogProduct?: ProductId;
  nav: "home" | "tshirt" | "mug" | "wzory";
  crumbs: { href: string; label: string }[];
  ctas: LandingCta[];
  sections: LandingSection[];
  faq: LandingFaq[];
  seeAlso: { href: string; label: string }[];
};

export type ProductGuideContent = {
  h2: string;
  intro: string;
  sections: LandingSection[];
  faq: LandingFaq[];
  seeAlso: { href: string; label: string }[];
};

const tshirt = productById("tshirt");
const mug = productById("mug");
const colorNames = shirtColors.map((item) => item.label.toLowerCase()).join(", ");
const sizeLine = sizes.join(", ");
const shirtZones = tshirt.zones.map((zone) => `${zone.label} ${zone.widthMm}×${zone.heightMm} mm`).join(" i ");
const mugZone = mug.zones.map((zone) => `${zone.label} ${zone.widthMm}×${zone.heightMm} mm`).join(", ");
const price = seller.priceFrom;
const cityIn = seller.cityIn;
const city = seller.city;
const lead = seller.leadTime;
const brand = seller.brand;

export const landingPaths: Record<LandingId, string> = {
  warszawa: "/nadruk-warszawa",
  rozmiary: "/koszulka/rozmiary",
  materialy: "/materialy",
};

export const landings: Record<LandingId, LandingPage> = {
  warszawa: {
    id: "warszawa",
    path: landingPaths.warszawa,
    title: `Nadruk w Warszawie na koszulce i kubku — ${brand}`,
    description: `Nadruk na koszulce i kubku przygotowujemy ${cityIn}. Koszulka ${sizeLine}, kubek ${mugCapacityMl} ml, cena ${price} brutto, gotowe w ${lead}.`,
    h1: `Nadruk na koszulce i kubku ${cityIn}`,
    lead: `Druk przygotowujemy ${cityIn}. W ofercie są dwie rzeczy z własnym projektem: koszulka z nadrukiem na przodzie i tyle oraz kubek ${mugCapacityMl} ml z nadrukiem na obwodzie. Cena wyjściowa ${price} brutto, czas przygotowania ${lead} — to produkcja, nie obietnica dnia doręczenia.`,
    kicker: `Druk ${cityIn} · ${price} brutto`,
    ogTitle: "Nadruk Warszawa",
    ogLine: "Koszulki i kubki, 1-2 dni",
    ogImage: `${landingPaths.warszawa}/opengraph-image`,
    nav: "home",
    crumbs: [
      { href: "/", label: brand },
      { href: landingPaths.warszawa, label: `Nadruk ${cityIn}` },
    ],
    ctas: [
      { href: productPaths.tshirt, label: "Koszulka z nadrukiem", primary: true },
      { href: productPaths.mug, label: "Kubek z nadrukiem" },
    ],
    sections: [
      {
        h2: "Co drukujemy w Warszawie",
        paragraphs: [
          `Serwis ${brand} nie jest katalogiem odzieży ani sklepem z gotowymi hasłami. Składasz własny nadruk w edytorze, oglądasz go na modelu 3D i zapisujesz projekt. Produkcja, którą już podajemy, dzieje się ${cityIn}.`,
          `Koszulka ma dwie strefy druku: ${shirtZones}. Kubek ma jedną: ${mugZone}. Innych produktów w tej ofercie nie ma — nie dopisujemy czapek, toreb ani magnesów, dopóki nie wejdą do asortymentu.`,
        ],
        list: [
          `Koszulka: rozmiary ${sizeLine}, kolory ${colorNames}.`,
          `Kubek: ${mugCapacityMl} ml, te same cztery kolory korpusu, nadruk na obwodzie.`,
          `Nakład: 1, 5, 10 albo 20 sztuk z tym samym projektem. Edytor i podgląd 3D są na stronie.`,
        ],
      },
      {
        h2: "Czas przygotowania i dostawa po Polsce",
        paragraphs: [
          `Przy rzeczy piszemy „gotowe w ${lead}”. To czas przygotowania druku ${cityIn}, a nie dzień, w którym kurier ma być pod drzwiami. Gdy sprzedaż będzie umową, dzień doręczenia podamy osobno, razem z kosztem przesyłki.`,
          `Dostawa jest po Polsce. Kosztu przesyłki nie zgadujemy na tej stronie: pojawi się przed płatnością, razem z wiążącą ceną brutto. ${price.charAt(0).toUpperCase()}${price.slice(1)} zostaje ceną wyjściową, dopóki ceny nie policzy system zamówień.`,
          `Płatności w tej wersji serwisu nie pobieramy. Zapis zgłoszenia nie jest zamówieniem z obowiązkiem zapłaty.`,
        ],
      },
      {
        h2: "Jak złożyć nadruk, jeśli jesteś w Warszawie albo poza nią",
        paragraphs: [
          `Adres ${city} dotyczy przygotowania druku, nie limitu „tylko odbiór osobisty”. Projekt składasz online: wybierasz koszulkę albo kubek, ustawiasz kolor i nakład, potem otwierasz edytor. Z Warszawy, Gdańska albo Wrocławia ścieżka jest ta sama.`,
          `Gotowy wzór z galerii możesz wziąć bez zmian albo poprawić tekst i zdjęcie. Pusty arkusz zostaje, jeśli chcesz projekt od zera.`,
        ],
      },
      {
        h2: "Cena w złotych",
        paragraphs: [
          `Wszystkie kwoty na stronie są w złotych polskich. ${price.charAt(0).toUpperCase()}${price.slice(1)} brutto to próg wyjściowy, ten sam na ławce i w znacznikach Product. Wiążącej ceny nie wymyślamy z góry: pojawi się, zanim poprosimy o płatność.`,
        ],
      },
    ],
    faq: [
      {
        q: `Czy nadruk na koszulce i kubku robicie ${cityIn}?`,
        a: `Tak. Druk przygotowujemy ${cityIn}. To zdanie jest to samo na ławce, na stronie dostawy i tutaj.`,
      },
      {
        q: "Ile trwa nadruk?",
        a: `Czas przygotowania, który już podajemy, to ${lead}. To produkcja, nie termin kuriera.`,
      },
      {
        q: "Czy wysyłacie poza Warszawę?",
        a: "Tak, dostawa jest po Polsce. Koszt przesyłki podamy przed płatnością, razem z wiążącą ceną brutto.",
      },
      {
        q: "Ile kosztuje nadruk?",
        a: `Cena wyjściowa ${price} brutto, w złotych. Wiążąca kwota pojawi się przed płatnością.`,
      },
    ],
    seeAlso: [
      { href: productPaths.tshirt, label: "Ławka koszulki" },
      { href: productPaths.mug, label: "Ławka kubka" },
      { href: landingPaths.rozmiary, label: "Rozmiary koszulek" },
      { href: landingPaths.materialy, label: "Kolory" },
      { href: "/prawne/dostawa", label: "Dostawa i płatność" },
    ],
  },
  rozmiary: {
    id: "rozmiary",
    path: landingPaths.rozmiary,
    title: `Rozmiary koszulek S–XL z nadrukiem — ${brand}`,
    description: `Koszulka z nadrukiem w rozmiarach ${sizeLine}. Nadruk na przodzie i tyle ma ${tshirt.zones[0].widthMm}×${tshirt.zones[0].heightMm} mm niezależnie od rozmiaru. Druk ${cityIn}, ${price}.`,
    h1: `Rozmiary koszulek z nadrukiem: ${sizeLine.replace(/, ([A-Z]+)$/, " i $1")}`,
    lead: `W ofercie koszulki są cztery rozmiary: ${sizeLine}. Tabeli w centymetrach na tej stronie nie ma — nie dopisujemy klatki piersiowej ani długości, dopóki kroj nie wejdzie do sprzedaży. Nadruk zostaje ten sam: ${shirtZones}. Im większa koszulka, tym więcej tkaniny widać wokół projektu.`,
    kicker: `Koszulka · ${sizeLine}`,
    ogTitle: "Rozmiary koszulek S-XL",
    ogLine: "Nadruk na przodzie i tyle",
    ogImage: `${landingPaths.rozmiary}/opengraph-image`,
    ogProduct: "tshirt",
    nav: "tshirt",
    crumbs: [
      { href: "/", label: brand },
      { href: productPaths.tshirt, label: tshirt.name },
      { href: landingPaths.rozmiary, label: "Rozmiary" },
    ],
    ctas: [
      { href: productPaths.tshirt, label: "Wybierz rozmiar na ławce", primary: true },
      { href: landingPaths.materialy, label: "Kolory" },
    ],
    sections: [
      {
        h2: "Jak działa rozmiar przy nadruku",
        paragraphs: [
          `Edytor rysuje nadruk w milimetrach strefy, nie w procentach koszulki. Przód i tył mają po ${tshirt.zones[0].widthMm}×${tshirt.zones[0].heightMm} mm na każdym rozmiarze z oferty. Rozmiar S nie obcina projektu, rozmiar XL go nie powiększa.`,
          `Druk przygotowujemy ${cityIn}. Cena wyjściowa ${price} brutto, w złotych — ta sama, co na ławce koszulki. Wiążącej kwoty za rozmiar nie różnicujemy: S nie jest tańsze od XL, dopóki cennik tego nie powie.`,
          `Dlatego przy wyborze rozmiaru myślisz o kroju ubrania, a nie o „większym nadruku”. Jeśli projekt ma dojść blisko szwów na mniejszej koszulce, sprawdź go na podglądzie 3D zanim zapiszesz zgłoszenie.`,
        ],
      },
      {
        h2: "Rozmiar S",
        paragraphs: [
          `S to najmniejsza koszulka w tej ofercie. Strefa druku zostaje ${tshirt.zones[0].widthMm}×${tshirt.zones[0].heightMm} mm, więc nadruk zajmuje większą część przodu i tyłu niż na XL. Małe napisy i detale widać z bliższa; szerokie tło grafiki szybciej dochodzi do krawędzi strefy.`,
          `Na ławce S jest jednym z czterech przycisków, obok M, L i XL. Nie przypisujemy go do wieku ani płci — tego w asortymencie nie ma.`,
        ],
      },
      {
        h2: "Rozmiar M",
        paragraphs: [
          `M jest rozmiarem startowym na ławce. Jeśli nie wiesz, od czego zacząć, zostaw M, otwórz edytor i oceń projekt na modelu. Nadruk ma te same milimetry co na pozostałych rozmiarach; zmienia się tylko ilość tkaniny wokół.`,
        ],
      },
      {
        h2: "Rozmiar L",
        paragraphs: [
          `L zostawia więcej tkaniny wokół tego samego nadruku ${tshirt.zones[0].widthMm}×${tshirt.zones[0].heightMm} mm. Projekt nie „rośnie” z rozmiarem: jeśli chcesz większą grafikę, nie pomoże L — pomoże inny układ na arkuszu.`,
        ],
      },
      {
        h2: "Rozmiar XL",
        paragraphs: [
          `XL jest największym rozmiarem, który teraz sprzedajemy. Nadruk nadal mieści się w ${shirtZones}. Na większej koszulce ten sam projekt wygląda skromniej względem korpusu — to cecha strefy, nie błąd edytora.`,
        ],
      },
      {
        h2: "Kubek nie ma rozmiaru S–XL",
        paragraphs: [
          `Kubek w ofercie ma pojemność ${mugCapacityMl} ml i nadruk na obwodzie ${mugZone}. Liter S, M, L, XL przy kubku nie wybierasz. Kolor korpusu — tak, te same cztery co przy koszulce.`,
        ],
      },
    ],
    faq: [
      {
        q: "Jakie rozmiary koszulek są w ofercie?",
        a: `Cztery: ${sizeLine}. Innych nie pokazujemy, bo ich nie ma w asortymencie.`,
      },
      {
        q: "Czy nadruk jest większy na XL?",
        a: `Nie. Przód i tył mają ${tshirt.zones[0].widthMm}×${tshirt.zones[0].heightMm} mm na każdym rozmiarze.`,
      },
      {
        q: "Gdzie jest tabela w centymetrach?",
        a: "Nie publikujemy jej, dopóki kroj nie wejdzie do sprzedaży. Nie zgadujemy obwodów.",
      },
      {
        q: "Czy kubek ma rozmiary?",
        a: `Nie. Kubek ma ${mugCapacityMl} ml i nadruk na obwodzie.`,
      },
    ],
    seeAlso: [
      { href: productPaths.tshirt, label: "Koszulka — ławka" },
      { href: productPaths.mug, label: "Kubek — ławka" },
      { href: landingPaths.materialy, label: "Kolory" },
      { href: landingPaths.warszawa, label: `Nadruk ${cityIn}` },
    ],
  },
  materialy: {
    id: "materialy",
    path: landingPaths.materialy,
    title: `Kolory koszulki i kubka z nadrukiem — ${brand}`,
    description: `Kolory oferty: ${colorNames}. Koszulka ${sizeLine}, kubek ${mugCapacityMl} ml. Ta sama paleta na obu rzeczach. Druk ${cityIn}, ${price} brutto.`,
    h1: "Kolory koszulki i kubka",
    lead: `W asortymencie nie ma składu tkaniny ani opisu glazury kubka — nie dopisujemy bawełny, poliestru ani ceramiki, skoro ławka tego nie pyta. Klient wybiera kolor rzeczy. Kolory: ${colorNames}. Ta sama czwórka maluje koszulkę i kubek.`,
    kicker: "Kolor rzeczy · cztery próbki",
    ogTitle: "Kolory koszulki i kubka",
    ogLine: "Czarny, piaskowy, bordowy, granatowy",
    ogImage: `${landingPaths.materialy}/opengraph-image`,
    nav: "home",
    crumbs: [
      { href: "/", label: brand },
      { href: landingPaths.materialy, label: "Kolory" },
    ],
    ctas: [
      { href: productPaths.tshirt, label: "Koszulka — wybierz kolor", primary: true },
      { href: productPaths.mug, label: "Kubek — wybierz kolor" },
    ],
    sections: [
      {
        h2: "Cztery kolory z oferty",
        paragraphs: [
          `Ta sama paleta maluje koszulkę i kubek. Na ławce są cztery próbki, nie wzornik Pantone i nie dowolny hex. Kolor zmieniasz kółkiem przy rzeczy: tkanina albo korpus na modelu przyjmują ten sam odcień, który widzisz na przycisku. Piątego koloru, mieszanki i własnego kodu nie przyjmujemy, bo ich nie ma w asortymencie.`,
        ],
        list: shirtColors.map((item) => {
          if (item.id === "black") {
            return `${item.label} (${item.value}) — najciemniejszy korpus. Jasny nadruk czyta się mocniej, ciemny wtapia się w tło.`;
          }
          if (item.id === "sand") {
            return `${item.label} (${item.value}) — jasny korpus. Ciemna grafika i czarny tekst zostają czytelne bez białej poddrukowej ramki, której w edytorze i tak nie ustawiasz osobno.`;
          }
          if (item.id === "wine") {
            return `${item.label} (${item.value}) — ciepły, ciemny czerwony. Dobrze trzyma kremowe i piaskowe tła projektu, gorzej bardzo ciemne plamy bez kontrastu.`;
          }
          return `${item.label} (${item.value}) — ciemny niebieski, nie kobalt przycisku strony. Kobalt ${brand} to kolor interfejsu (#2F5BFF), nie kolor koszulki.`;
        }),
      },
      {
        h2: "Kolor na modelu, nie na arkuszu",
        paragraphs: [
          `Kolor dotyczy rzeczy, nie farby nadruku. Arkusz w edytorze zostaje przezroczysty poza Twoją grafiką. Ciemny korpus dostaje jasny tekst startowy, jasny — ciemny, żeby napis było widać. Własny kolor napisu, który sam ustawisz, edytor zostawia.`,
          `Na czarnym, bordowym i granatowym jaśniejsza grafika czyta się pewniej. Na piaskowym pewniej czyta się ciemna. To nie osobna opcja na ławce — to skutek kontrastu, który widzisz od razu na podglądzie 3D.`,
          `Kubek i koszulka dzielą paletę, ale nie dzielą strefy. Zmiana koloru koszulki nie maluje kubka w koszyku: to dwie osobne rzeczy, każda ze swoim projektem. Na ławce kubka i na ławce koszulki kółka kolorów są te same cztery.`,
        ],
      },
      {
        h2: "Czego w materiałach nie ma",
        paragraphs: [
          `Nie ma gramatury, procentu bawełny, certyfikatu OEKO-TEX, pojemności innej niż ${mugCapacityMl} ml i piątego koloru. Gdy kroj, tkanina albo szkliwo dostaną pola w ofercie, pojawią się tutaj z tych samych danych co ławka — nie wcześniej.`,
          `Nakład na ławce to 1, 5, 10 albo 20 sztuk. Kolor dotyczy całego nakładu: dwadzieścia sztuk wychodzi w tym samym czarnym, piaskowym, bordowym albo granatowym, który wybrałeś na ławce.`,
          `Druk przygotowujemy ${cityIn}, cena wyjściowa ${price} brutto. Kolor nie zmienia tego progu, dopóki system zamówień nie policzy wiążącej kwoty.`,
        ],
      },
    ],
    faq: [
      {
        q: "Z jakiego materiału jest koszulka?",
        a: "Składu tkaniny nie podajemy, bo nie ma go w ofercie. Na ławce wybierasz kolor rzeczy, rozmiar i nakład.",
      },
      {
        q: "Jakie kolory są dostępne?",
        a: `${shirtColors.map((item) => item.label).join(", ")} — na koszulce i na kubku.`,
      },
      {
        q: "Czy kubek i koszulka mają te same kolory?",
        a: "Tak. Czarny, piaskowy, bordowy i granatowy — ta sama lista na obu ławkach.",
      },
      {
        q: "Czy kubek jest ceramiczny?",
        a: `Piszemy pojemność ${mugCapacityMl} ml i nadruk na obwodzie. Tworzywa kubka nie dopisujemy.`,
      },
    ],
    seeAlso: [
      { href: productPaths.tshirt, label: "Koszulka — ławka" },
      { href: productPaths.mug, label: "Kubek — ławka" },
      { href: landingPaths.rozmiary, label: "Rozmiary koszulek" },
      { href: landingPaths.warszawa, label: `Nadruk ${cityIn}` },
    ],
  },
};

export const productGuides: Record<ProductId, ProductGuideContent> = {
  tshirt: {
    h2: "Koszulka z własnym nadrukiem: co wybierasz na ławce",
    intro: `To nie osobna karta z hasłem reklamowym — to ta sama koszulka, którą konfigurujesz powyżej. Rozmiary ${sizeLine}, kolory ${colorNames}, nadruk ${shirtZones}. Druk ${cityIn}, cena wyjściowa ${price} brutto, przygotowanie w ${lead}.`,
    sections: [
      {
        h2: "Strefy druku na koszulce",
        paragraphs: [
          `Przód i tył mają po ${tshirt.zones[0].widthMm} mm szerokości i ${tshirt.zones[0].heightMm} mm wysokości. W edytorze to dwa arkusze, nie jeden plik „na całą koszulkę”. Projekt z przodu nie kopiuje się sam na tył.`,
          `Podgląd 3D pokazuje nadruk na modelu po to, żebyś widział krawędzie strefy zanim zapiszesz zgłoszenie. Do produkcji idzie płaski arkusz, nie zrzut z modelu.`,
        ],
      },
      {
        h2: "Rozmiar, kolor, nakład",
        paragraphs: [
          `Rozmiar zmienia kroj koszulki, nie milimetry nadruku — szerszy opis jest na stronie rozmiarów. Kolor maluje tkaninę na modelu. Nakład to 1, 5, 10 albo 20 sztuk z tym samym projektem.`,
          `Jeśli masz gotowy plik zamiast pracy w edytorze, na ławce jest o tym zdanie: podepniemy go razem ze zgłoszeniem. Osobnego pola „plik z dysku” na tej karcie nie ma.`,
        ],
      },
    ],
    faq: [
      {
        q: "Jakie rozmiary ma koszulka z nadrukiem?",
        a: `${sizeLine}. Nadruk na przodzie i tyle ma ${tshirt.zones[0].widthMm}×${tshirt.zones[0].heightMm} mm na każdym z nich.`,
      },
      {
        q: "Jakie kolory koszulki są w ofercie?",
        a: `${shirtColors.map((item) => item.label).join(", ")}.`,
      },
      {
        q: `Gdzie drukujecie koszulkę?`,
        a: `Druk przygotowujemy ${cityIn}. Czas przygotowania ${lead}.`,
      },
      {
        q: "Ile kosztuje koszulka z nadrukiem?",
        a: `Cena wyjściowa ${price} brutto, w złotych. Wiążąca kwota będzie przed płatnością.`,
      },
    ],
    seeAlso: [
      { href: landingPaths.rozmiary, label: "Rozmiary S–XL" },
      { href: landingPaths.materialy, label: "Kolory" },
      { href: landingPaths.warszawa, label: `Nadruk ${cityIn}` },
      { href: productPaths.mug, label: "Kubek z nadrukiem" },
      { href: "/wzory?produkt=koszulka", label: "Gotowe wzory na koszulkę" },
    ],
  },
  mug: {
    h2: "Kubek z własnym nadrukiem: obwód i 330 ml",
    intro: `Kubek w ofercie ma ${mugCapacityMl} ml i jedną strefę druku: ${mugZone}. Rozmiarów S–XL przy kubku nie ma. Kolory korpusu są te same co przy koszulce: ${colorNames}. Druk ${cityIn}, ${price} brutto, przygotowanie w ${lead}.`,
    sections: [
      {
        h2: "Nadruk na obwodzie, nie na uchu",
        paragraphs: [
          `Strefa „Obwód” ma ${mug.zones[0].widthMm} mm na ${mug.zones[0].heightMm} mm. To pasek wokół kubka, od strony uchwytu licząc początek łuku na podglądzie 3D. Ucho i denko nie są polami nadruku w tej ofercie.`,
          `W edytorze jest jeden arkusz, nie dwa. Gotowy wzór na kubek też ląduje na obwodzie — jeśli wzór nie pasuje do strefy, karta wzoru tego nie otworzy.`,
        ],
      },
      {
        h2: "Kolor korpusu",
        paragraphs: [
          `Czarny, piaskowy, bordowy i granatowy zmieniają kubek na modelu tak samo jak koszulkę. Pojemność zostaje ${mugCapacityMl} ml — innej w asortymencie nie ma.`,
          `Nakład 1, 5, 10 albo 20 sztuk niesie ten sam projekt. Wiążącej ceny za sztukę nie ma, dopóki system zamówień jej nie policzy; na ławce zostaje ${price} brutto.`,
        ],
      },
    ],
    faq: [
      {
        q: "Jaka jest pojemność kubka z nadrukiem?",
        a: `${mugCapacityMl} ml. Innej pojemności nie oferujemy.`,
      },
      {
        q: "Gdzie jest nadruk na kubku?",
        a: `Na obwodzie, w strefie ${mug.zones[0].widthMm}×${mug.zones[0].heightMm} mm.`,
      },
      {
        q: "Czy kubek ma rozmiary S–XL?",
        a: "Nie. Rozmiary S, M, L i XL dotyczą tylko koszulki.",
      },
      {
        q: `Gdzie drukujecie kubek i ile to trwa?`,
        a: `Druk przygotowujemy ${cityIn}, czas przygotowania ${lead}. Cena wyjściowa ${price} brutto.`,
      },
    ],
    seeAlso: [
      { href: landingPaths.materialy, label: "Kolory" },
      { href: landingPaths.warszawa, label: `Nadruk ${cityIn}` },
      { href: productPaths.tshirt, label: "Koszulka z nadrukiem" },
      { href: landingPaths.rozmiary, label: "Rozmiary koszulek" },
      { href: "/wzory?produkt=kubek", label: "Gotowe wzory na kubek" },
    ],
  },
};

export function getLanding(id: LandingId): LandingPage {
  return landings[id];
}

export function allLandings(): LandingPage[] {
  return Object.values(landings);
}

export function landingSitemapPaths(): string[] {
  return allLandings().map((item) => item.path);
}

/** Widoczny opis pod H1 ławki — ten sam zestaw faktów, co JSON-LD. */
export function shopLead(id: ProductId): string {
  if (id === "tshirt") {
    return `Koszulka z własnym nadrukiem. Strefy ${shirtZones}, rozmiary ${sizeLine}, kolory ${colorNames}. Druk ${cityIn}, cena wyjściowa ${price} brutto.`;
  }
  return `Kubek ${mugCapacityMl} ml z nadrukiem na obwodzie (${mugZone}). Kolory ${colorNames}. Druk ${cityIn}, gotowe w ${lead}, ${price} brutto.`;
}
