import { productPaths } from "@/lib/catalog";
import { landingPaths } from "@/lib/landings";
import { seller } from "@/lib/seller";

const catalogLinks = [
  [productPaths.tshirt, "Koszulka"],
  [productPaths.mug, "Kubek"],
  ["/wzory", "Wzory"],
  [landingPaths.warszawa, "Nadruk w Warszawie"],
  [landingPaths.rozmiary, "Rozmiary"],
  [landingPaths.materialy, "Kolory i wykończenie"],
] as const;

const legalLinks = [
  ["/prawne/kontakt", "Kontakt"],
  ["/prawne/regulamin", "Regulamin"],
  ["/prawne/prywatnosc", "Prywatność"],
  ["/prawne/cookies", "Cookies"],
  ["/prawne/odstapienie", "Odstąpienie"],
  ["/prawne/reklamacje", "Reklamacje"],
  ["/prawne/dostawa", "Dostawa i płatność"],
] as const;

export function SiteFooter() {
  return (
    <footer className="font-ui border-t border-[#16130F]/10 px-5 py-6 text-sm text-muted md:px-7">
      <nav aria-label="Oferta" className="flex flex-wrap gap-x-4 gap-y-2">
        {catalogLinks.map(([href, label]) => (
          <a key={href} href={href} className="hover:text-(--a-mark)">
            {label}
          </a>
        ))}
      </nav>
      <nav aria-label="Prawne" className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {legalLinks.map(([href, label]) => (
          <a key={href} href={href} className="hover:text-(--a-mark)">
            {label}
          </a>
        ))}
      </nav>
      <p className="mt-3">
        {seller.brand} · {seller.city} · cena wyjściowa {seller.priceFrom} brutto
      </p>
    </footer>
  );
}
