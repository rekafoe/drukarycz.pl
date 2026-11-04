"use client";

import Link from "next/link";
import { BrandMark, inkButton } from "@/components/brand";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="halftone-ink grid min-h-dvh place-items-center bg-cream px-6 text-center text-poster">
      <div className="grid max-w-sm justify-items-center gap-4">
        <BrandMark className="text-2xl" />
        <h1 className="font-display text-[28px] leading-tight font-extrabold tracking-[-0.02em]">Coś poszło nie tak.</h1>
        <p className="text-muted">Strona nie wczytała się do końca. Zapisany projekt zostaje na serwerze.</p>
        <button type="button" className={`${inkButton} px-6 py-3`} onClick={reset}>
          Spróbuj jeszcze raz
        </button>
        <Link href="/" className="text-sm font-semibold text-muted hover:text-poster">
          Wróć do sklepu
        </Link>
      </div>
    </main>
  );
}
