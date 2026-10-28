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
    <footer className="border-t border-line px-5 py-6 text-sm text-muted md:px-7">
      <nav className="flex flex-wrap gap-x-4 gap-y-2">
        {links.map(([href, label]) => (
          <a key={href} href={href} className="hover:text-ink">
            {label}
          </a>
        ))}
      </nav>
      <p className="mt-3">merch.by · Warszawa · cena wyjściowa od 5 zł brutto</p>
    </footer>
  );
}
