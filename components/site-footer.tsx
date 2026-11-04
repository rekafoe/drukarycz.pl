import { BrandMark, PriceChip } from "@/components/brand";
import { seller } from "@/lib/seller";

const links = [
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
    <footer className="on-poster halftone bg-poster px-5 pt-10 pb-8 text-cream md:px-7">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="grid gap-3">
          <BrandMark className="text-2xl md:text-3xl" />
          <p className="max-w-sm text-sm text-cream/65">
            Koszulki i kubki z własnym nadrukiem. Miejsce druku: {seller.city}.
          </p>
          <span className="flex items-center gap-3 text-sm text-cream/65">
            <PriceChip size="sm" /> cena wyjściowa brutto
          </span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-cream/80" aria-label="Informacje prawne">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="hover:text-cream">
              {label}
            </a>
          ))}
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-7xl border-t border-cream/10 pt-5 text-xs text-cream/50">
        {seller.brand} · {seller.city} · cena wyjściowa {seller.priceFrom} brutto
      </p>
    </footer>
  );
}
