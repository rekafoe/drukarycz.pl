/** Пустые слоты заполняет организация. Не подставлять вымышленные NIP, KRS, адрес и телефон. */
export const sessionCookieName = "drukarycz_session";

export const seller = {
  brand: "drukarycz.pl",
  city: "Warszawa",
  country: "Polska",
  leadTime: "1–2 dni robocze",
  priceFrom: "od 5 zł",
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
