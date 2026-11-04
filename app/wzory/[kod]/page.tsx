import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { WzorCardView } from "@/components/wzory/wzor-card";
import { WzoryHeader } from "@/components/wzory/wzory-header";
import { seller } from "@/lib/seller";
import { wzorTitle, wzoryMessages } from "@/lib/wzory/labels";
import { findWzorByCode, toCard, wzorCategories } from "@/lib/wzory/service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ kod: string }> };

function cleanCode(value: string) {
  return /^\d{1,12}$/.test(value) ? value : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const code = cleanCode((await params).kod);
  return { title: `${code ? wzorTitle(code) : "Wzór"} — ${seller.brand}` };
}

export default async function WzorPage({ params }: Props) {
  const code = cleanCode((await params).kod);
  const result = code ? await findWzorByCode(code) : null;
  const categories = result?.ok ? await wzorCategories().catch(() => []) : [];

  return (
    <main className="min-h-full">
      <WzoryHeader />
      <div className="px-5 pb-3 md:px-7">
        <Link href="/wzory" className="text-sm font-bold">
          ← Wszystkie wzory
        </Link>
      </div>
      {result?.ok ? (
        <WzorCardView
          wzor={toCard(result.wzor)}
          asIs={result.wzor.asIs}
          categoryName={categories.find((item) => item.id === result.wzor.categoryId)?.name ?? null}
        />
      ) : (
        <section className="mx-5 grid max-w-2xl gap-3 rounded-[20px] border border-line bg-card p-6 md:mx-7 md:p-8" role="alert">
          <p className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">{code ? wzorTitle(code) : "Wzór"}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{result ? wzoryMessages.notFitting : wzoryMessages.notFound}</h1>
          <p className="text-muted">
            {result
              ? "Nie otworzymy go w edytorze, żeby nadruk nie wyszedł krzywo. Wybierz inny wzór albo zacznij od pustego arkusza."
              : "Mógł zostać zdjęty z oferty. Zobacz pozostałe wzory."}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href="/wzory" className="rounded-xl bg-ink px-5 py-3 font-bold text-white">
              Zobacz inne wzory
            </Link>
            <Link href="/" className="rounded-xl border border-ink px-5 py-3 font-bold text-ink">
              Zrób własny
            </Link>
          </div>
        </section>
      )}
      <div className="mt-10">
        <SiteFooter />
      </div>
    </main>
  );
}
