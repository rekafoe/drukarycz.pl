/** Пустые слоты заполняет организация. Не подставлять вымышленные NIP, KRS, адрес и телефон. */
export const sessionCookieName = "drukarycz_session";

const priceFromPln = 5;

export const seller = {
  brand: "drukarycz.pl",
  city: "Warszawa",
  cityIn: "w Warszawie",
  country: "Polska",
  leadTime: "1–2 dni robocze",
  priceFromPln,
  priceFrom: `od ${priceFromPln} zł`,
  legalName: "",
  street: "",
  postalCode: "",
  nip: "",
  regon: "",
  register: "",
  email: "",
  phone: "",
};

export const sellerGaps = [
  ["legalName", "Nazwa firmy"],
  ["street", "Ulica i numer"],
  ["postalCode", "Kod pocztowy siedziby"],
  ["nip", "NIP"],
  ["regon", "REGON"],
  ["register", "KRS albo CEIDG"],
  ["email", "E-mail"],
  ["phone", "Telefon"],
] as const;
