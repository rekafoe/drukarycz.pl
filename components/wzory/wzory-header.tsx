import Link from "next/link";
import { seller } from "@/lib/seller";

export function WzoryHeader() {
  return (
    <header className="flex items-center justify-between gap-4 px-5 py-4 md:px-7">
      <Link href="/" className="text-lg font-extrabold tracking-tight">
        {seller.brand}
      </Link>
      <nav className="flex items-center gap-4 text-sm font-semibold text-muted">
        <Link href="/wzory" className="hover:text-ink">
          Wzory
        </Link>
        <Link href="/" className="hover:text-ink">
          Do sklepu
        </Link>
      </nav>
    </header>
  );
}
