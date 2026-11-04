import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { seller } from "@/lib/seller";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-cream/90 text-poster backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-7">
        <Link href="/" className="text-[17px] sm:text-lg md:text-xl" aria-label={`${seller.brand} — start`}>
          <BrandMark />
        </Link>
        <div className="flex-1" />
        <Link
          href="/"
          className="rounded-full border border-poster/15 bg-white px-4 py-2 text-sm font-semibold whitespace-nowrap hover:border-poster"
        >
          Wróć do sklepu
        </Link>
      </div>
    </header>
  );
}
