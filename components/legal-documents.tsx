import { seller, sellerGaps, sessionCookieName } from "@/lib/seller";

export const legalSlugs = [
  "kontakt",
  "regulamin",
  "prywatnosc",
  "cookies",
  "odstapienie",
  "reklamacje",
  "dostawa",
] as const;

export type LegalSlug = (typeof legalSlugs)[number];

export function isLegalSlug(value: string): value is LegalSlug {
  return (legalSlugs as readonly string[]).includes(value);
}

export const legalTitles: Record<LegalSlug, string> = {
  kontakt: "Dane sprzedawcy i kontakt",
  regulamin: "Regulamin",
  prywatnosc: "Polityka prywatności",
  cookies: "Cookies",
  odstapienie: "Odstąpienie od umowy",
  reklamacje: "Reklamacje",
  dostawa: "Dostawa i płatność",
};

export function LegalArticle({ slug }: { slug: LegalSlug }) {
  return (
    <div className="mt-6 grid gap-4 text-[15px] leading-relaxed">
      <h1 className="font-poster text-[40px] leading-[0.95] font-black tracking-tight md:text-[52px]">{legalTitles[slug]}</h1>
      <p className="text-sm text-muted">{seller.brand} · wersja serwisu z 28 października 2026</p>
      {slug === "kontakt" ? <Kontakt /> : null}
      {slug === "regulamin" ? <Regulamin /> : null}
      {slug === "prywatnosc" ? <Prywatnosc /> : null}
      {slug === "cookies" ? <Cookies /> : null}
      {slug === "odstapienie" ? <Odstapienie /> : null}
      {slug === "reklamacje" ? <Reklamacje /> : null}
      {slug === "dostawa" ? <Dostawa /> : null}
    </div>
  );
}

function H2({ children }: { children: string }) {
  return <h2 className="mt-6 text-xl font-extrabold tracking-tight">{children}</h2>;
}

function SellerFacts() {
  return (
    <ul className="grid gap-1">
      <li>Oznaczenie: {seller.brand}</li>
      <li>
        Miasto: {seller.city}, {seller.country}
      </li>
      {sellerGaps.map(([key, label]) => {
        const value = seller[key].trim();
        return (
          <li key={key}>
            {label}: {value || "do uzupełnienia przed rozpoczęciem sprzedaży"}
          </li>
        );
      })}
    </ul>
  );
}

function Kontakt() {
  return (
    <>
      <p>
        {seller.brand} to serwis do projektowania nadruku na koszulce i kubku. Siedziba organizacyjna, którą już
        podajemy, to {seller.city}, {seller.country}.
      </p>
      <H2>Dane, które muszą być na stronie przed sprzedażą</H2>
      <SellerFacts />
      <p>
        Pól bez treści nie uzupełniamy zmyślonym adresem, NIP-em ani numerem KRS. Dopóki organizacja ich nie wpisze,
        serwis nie przyjmuje płatności i nie zawiera umowy sprzedaży.
      </p>
      <H2>Jak napisać</H2>
      <p>
        Kanał reklamacji i odstąpienia to e-mail sprzedawcy z tej strony. Gdy pole e-mail jest puste, nie udajemy, że
        list dokądś dojdzie. Zgłoszenie zapisane w koszyku zostaje na serwerze {seller.brand} i nie jest zamówieniem opłaconym.
      </p>
    </>
  );
}

function Regulamin() {
  return (
    <>
      <p>
        Regulamin opisuje serwis {seller.brand}: projekt nadruku, konto i zapis zgłoszenia. Tekst jest po polsku, bo
        z usługi korzysta konsument w Polsce.
      </p>
      <H2>Czego ten serwis jeszcze nie robi</H2>
      <p>
        Przycisk w koszyku nazywa się „Zapisz zgłoszenie”. Zapisuje projekt i dane na serwerze {seller.brand}. Nie pobiera
        płatności i nie tworzy obowiązku zapłaty. Umowa sprzedaży powstanie dopiero wtedy, gdy sprzedawca poda cenę z
        podatkiem i kosztem dostawy, a klient ją przyjmie i zapłaci. Do tego momentu przycisk nie będzie miał treści
        „Zamawiam i płacę”.
      </p>
      <H2>Sprzedawca</H2>
      <SellerFacts />
      <p>
        Przed rozpoczęciem sprzedaży organizacja uzupełnia te dane i potwierdza ten regulamin. Do tego czasu nie
        prowadzimy sprzedaży.
      </p>
      <H2>Co można zamówić później</H2>
      <p>
        Koszulka: przód i tył, rozmiar z listy, kolor z listy. Kubek: nadruk na obwodzie, pojemność 330 ml, te same
        kolory. Wykończenie nadruku klient widzi tylko jako brak wykończenia, matowe albo błyszczące. Szerokości
        rolki na stronie nie ma.
      </p>
      <H2>Cena</H2>
      <p>
        Napis „{seller.priceFrom}” to cena wyjściowa brutto, a nie cena, którą trzeba zapłacić. Nie jest to cena
        wiążąca. Wiążącą cenę z podatkiem i osobno podany koszt dostawy sprzedawca poda przed płatnością. Dopóki ceny
        nie liczy system zamówień, nie pokazujemy innej kwoty.
      </p>
      <H2>Konto i projekt</H2>
      <p>
        Gość może złożyć projekt. Zapis zgłoszenia i ponowne otwarcie własnego projektu wymagają logowania telefonem i
        kodem. W tej wersji kod widać na ekranie, to nie jest kampania SMS. Cudzego projektu linkiem nie otworzysz.
        Konto usuwasz przyciskiem „Usuń konto”. Wraz z kontem schodzi zapisany projekt.
      </p>
      <p>
        Projekt, w tym zdjęcie wgrane na arkusz, ma należeć do Ciebie albo musisz mieć prawo go użyć. Nie przyjmujemy
        treści bezprawnych.
      </p>
      <H2>Rzecz na indywidualne zamówienie</H2>
      <p>
        Nadruk według Twojego projektu jest rzeczą wykonaną według specyfikacji konsumenta. Przed zapisem zgłoszenia
        jest na to osobna, domyślnie pusta zgoda. Opis wyjątku od 14 dni jest na stronie Odstąpienie. Zgoda na
        regulamin to drugie, osobne pole.
      </p>
      <H2>Reklamacje, dostawa, dane</H2>
      <p>
        Zasady dostawy i płatności, reklamacji, odstąpienia, prywatności i cookies są na osobnych stronach tego
        serwisu. Przed sprzedażą mają być dostępne tak samo jak teraz: z drzwi, ze sklepu, z koszyka i z edytora.
      </p>
      <H2>Prawo</H2>
      <p>
        Do serwisu stosujemy prawo polskie. Sprawy konsumenckie, których ten regulamin nie może odebrać, zostają przy
        konsumencie. To obejmuje przepisy ustawy o prawach konsumenta i ustawy o świadczeniu usług drogą elektroniczną.
      </p>
    </>
  );
}

function Prywatnosc() {
  return (
    <>
      <p>
        Administratorem danych jest organizacja prowadząca {seller.brand}. Jej nazwa, adres i e-mail pojawią się na
        stronie Kontakt, gdy organizacja je uzupełni. Do tego czasu nie podajemy zmyślonego administratora.
      </p>
      <H2>Jakie dane zbieramy</H2>
      <ul className="grid list-disc gap-1 pl-5">
        <li>telefon i imię przy logowaniu,</li>
        <li>e-mail, ulicę, kod pocztowy, miejscowość i opcjonalny NIP w koszyku,</li>
        <li>projekt nadruku i podgląd, w tym zdjęcie, które sam wgrywasz,</li>
        <li>treść dwóch zgód i dobrowolnej zgody marketingowej oraz czas ich zapisu,</li>
        <li>identyfikator w ciasteczku {sessionCookieName}, potrzebny, żeby odtworzyć projekt i sesję.</li>
      </ul>
      <H2>Po co i na jakiej podstawie</H2>
      <p>
        Konto, projekt i zgłoszenie przetwarzamy, żeby świadczyć usługę elektroniczną i przygotować zamówienie, o które
        prosisz (art. 6 ust. 1 lit. b RODO). Ciasteczko sesji jest niezbędne do tej usługi. Marketing e-mailem lub
        SMS-em włączamy tylko, gdy osobne pole w koszyku jest zaznaczone (art. 6 ust. 1 lit. a RODO). To pole jest
        domyślnie puste i nie jest warunkiem zgłoszenia. Kod logowania nie jest marketingiem.
      </p>
      <p>
        Podanie telefonu jest potrzebne do konta. E-mail i adres są potrzebne do zgłoszenia. NIP jest dobrowolny i
        służy fakturze, gdy sprzedaż już będzie fakturowana. Brak NIP-u nie blokuje zgłoszenia.
      </p>
      <H2>Jak długo</H2>
      <p>
        Konto i projekt trzymamy, dopóki nie usuniesz konta. Przycisk „Usuń konto” jest przy imieniu po zalogowaniu.
        Usuwa konto i zapisany projekt z serwera {seller.brand}. Gdy pojawią się prawdziwe faktury, dane zamówienia potrzebne do
        podatku zostaną przez okres przechowywania faktur, a usunięcie konta zanonimizuje resztę zamiast kasować zapis
        podatkowy. W tej wersji faktur nie wystawiamy.
      </p>
      <H2>Komu przekazujemy</H2>
      <p>
        Zgłoszenie nie idzie do CRM. Płatności nie ma, więc nie ma operatora płatności. SMS-ów z kodem nie wysyłamy: kod
        testowy widać na ekranie. Osobne umowy powierzenia z hostingiem, CRM, SMS i płatnością opisujemy, zanim te
        usługi zaczną przetwarzać dane klientów.
      </p>
      <H2>Twoje prawa</H2>
      <p>
        Możesz żądać dostępu, sprostowania, usunięcia, ograniczenia, przeniesienia i sprzeciwu oraz cofnąć zgodę
        marketingową. Wniosek pójdzie na e-mail sprzedawcy, gdy będzie podany na stronie Kontakt. Skargę można złożyć
        do Prezesa Urzędu Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa.
      </p>
      <p>
        Serwis nie jest dla dzieci. Zgoda cyfrowa w Polsce dotyczy osoby od 16. roku życia. Nie podejmujemy
        zautomatyzowanych decyzji, które wywołują wobec Ciebie skutek prawny.
      </p>
    </>
  );
}

function Cookies() {
  return (
    <>
      <p>
        Używamy jednego ciasteczka technicznego: {sessionCookieName}. Jest httpOnly, SameSite=Lax, działa w całej witrynie i
        wygasa po 30 dniach. Trzyma identyfikator sesji, żeby projekt i logowanie przetrwały odświeżenie strony.
      </p>
      <p>
        To ciasteczko jest niezbędne do usługi, którą sam otwierasz. Nie pytamy o zgodę banerem, bo nie ma ciasteczek
        analitycznych ani marketingowych. Baner dodamy dopiero wtedy, gdy pojawi się narzędzie inne niż sesja.
      </p>
      <p>
        Sesję kończy „Wyloguj”. Konto i projekt kasuje „Usuń konto”. Ciasteczko możesz też usunąć w przeglądarce. Bez
        niego serwis założy pustą sesję.
      </p>
    </>
  );
}

function Odstapienie() {
  return (
    <>
      <p>
        Przy umowie zawieranej na odległość konsument ma co do zasady 14 dni na odstąpienie bez podania przyczyny.
        Termin liczy się od objęcia rzeczy w posiadanie. W tej wersji serwisu umowa sprzedaży nie powstaje, bo nie
        pobieramy płatności i nie podajemy ceny wiążącej.
      </p>
      <H2>Wyjątek dla indywidualnego nadruku</H2>
      <p>
        Wyjątek z art. 38 pkt 3 ustawy o prawach konsumenta dotyczy rzeczy nieprefabrykowanej, wyprodukowanej według
        specyfikacji konsumenta lub służącej zaspokojeniu jego zindywidualizowanych potrzeb. Koszulka i kubek z Twoim
        nadrukiem są taką rzeczą. Wyjątek działa tylko wtedy, gdy przed umową zgodzisz się na to osobno. W koszyku jest
        do tego osobne pole, domyślnie puste, obok zgody na regulamin. Zgoda na regulamin tego wyjątku nie zastępuje.
      </p>
      <p>
        Jeśli rzecz nie będzie wykonana według Twojego projektu, 14 dni zostaje. Formularz poniżej jest wzorem na ten
        przypadek i na czas, gdy sprzedaż już będzie zawierana.
      </p>
      <H2>Wzór formularza odstąpienia</H2>
      <div className="rounded-2xl border border-line bg-card p-4 text-sm">
        <p className="font-bold">Wzór formularza odstąpienia od umowy</p>
        <p className="mt-2 text-muted">Wypełnij i odeślij tylko wtedy, gdy chcesz odstąpić od umowy.</p>
        <p className="mt-3">
          Adresat: sprzedawca {seller.brand}. Nazwa, adres pocztowy, telefon i e-mail — ze strony Dane sprzedawcy, gdy
          organizacja je uzupełni.
        </p>
        <p className="mt-3">
          Ja/My(*) niniejszym informuję/informujemy(*) o moim/naszym odstąpieniu od umowy sprzedaży następujących
          rzeczy(*) / o świadczenie następującej usługi(*):
        </p>
        <p className="mt-3">Data zawarcia umowy(*) / odbioru(*):</p>
        <p className="mt-3">Imię i nazwisko konsumenta(-ów):</p>
        <p className="mt-3">Adres konsumenta(-ów):</p>
        <p className="mt-3">Podpis konsumenta(-ów) (tylko jeżeli formularz jest przesyłany w wersji papierowej):</p>
        <p className="mt-3">Data:</p>
        <p className="mt-3 text-muted">(*) Niepotrzebne skreślić.</p>
      </div>
    </>
  );
}

function Reklamacje() {
  return (
    <>
      <p>
        Gdy sprzedaż już będzie umową, rzecz ma być zgodna z umową: zgodna z opisem, rozmiarem, kolorem i projektem,
        który zatwierdziłeś. Reklamację konsumenta rozpatrujemy w ciągu 14 dni od jej otrzymania.
      </p>
      <p>
        W reklamacji napisz, czego żądasz, czego dotyczy rzecz i jak się z Tobą skontaktować. Dołącz numer zgłoszenia,
        jeśli go dostaniesz, i zdjęcie wady, jeśli da się ją pokazać.
      </p>
      <p>
        Adresem reklamacji będzie e-mail sprzedawcy ze strony Kontakt. Dopóki to pole jest puste, nie podajemy
        zastępczego adresu. W tej wersji nie ma jeszcze umowy sprzedaży, więc nie przyjmujemy reklamacji towaru tak,
        jakby był już sprzedany.
      </p>
      <p>
        Prawa konsumenta wobec niezgodności towaru z umową wynikają z ustawy o prawach konsumenta i nie zależą od tego
        tekstu. Dokładne brzmienie procedury potwierdza organizacja przed startem płatności.
      </p>
    </>
  );
}

function Dostawa() {
  return (
    <>
      <p>
        Druk przygotowujemy {seller.cityIn}. Czas przygotowania, który już podajemy przy rzeczy, to {seller.leadTime}.
        To czas produkcji, nie obietnica dnia doręczenia przez przewoźnika.
      </p>
      <p>
        Dostawa jest po Polsce. Kosztu dostawy nie wpisujemy z góry: podamy go przed płatnością, razem z wiążącą ceną
        brutto. „{seller.priceFrom}” zostaje ceną wyjściową brutto, dopóki ceny nie policzy system zamówień.
      </p>
      <p>
        Płatności w tej wersji nie pobieramy. Nie ma operatora płatności, przelewu ani płatności przy odbiorze. Zapis
        zgłoszenia nie jest zamówieniem z obowiązkiem zapłaty. Sposób płatności i przewoźnik pojawią się, zanim
        włączymy sprzedaż.
      </p>
    </>
  );
}
