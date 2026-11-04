"use client";

import Link from "next/link";
import { useState } from "react";
import { WzorMockup } from "@/components/wzory/wzor-mockup";
import { seller } from "@/lib/seller";
import type { PrintFiles, WorkSnapshot } from "@/lib/work";
import { designOrderParams } from "@/lib/wzory/choose";
import { feeLabel, formatZl, wzorTitle, zonesLabel } from "@/lib/wzory/labels";
import { exportTemplatePrints } from "@/lib/wzory/render-client";
import { productSlugs } from "@/lib/wzory/types";

/** Выбранный wzór на лавке: миниатюра, «Zmień wzór», «Usuń wzór» и путь в корзину без редактора. */
export function ChosenWzor({
  work,
  onCart,
  onEdit,
  onRemove,
}: {
  work: WorkSnapshot;
  onCart: (printFiles: PrintFiles, previewUrl: string | null, note: string | null) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const design = work.design;
  if (!design) return null;
  const params = designOrderParams(work);
  const fee = design.usageFee > 0 ? `+ ${formatZl(design.usageFee)} za wzór` : "+ wzór w cenie";

  async function toCart() {
    setBusy(true);
    try {
      const result = await exportTemplatePrints(work);
      onCart(result.printFiles, result.previewUrl, result.failed ? "Nie udało się zapisać pliku do druku." : null);
    } catch {
      onCart({}, null, "Nie udało się zapisać pliku do druku.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-ink/20 bg-card p-3" aria-label="Wybrany wzór">
      <div className="flex gap-3">
        <div className="h-[104px] w-[84px] shrink-0 overflow-hidden rounded-xl bg-paper p-1">
          {params.designModified && work.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={work.previewUrl} alt="" className="h-full w-full rounded-lg object-contain" style={{ background: work.color }} />
          ) : (
            <WzorMockup product={design.product} color={work.color} previews={design.previews} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">Wybrany wzór</p>
          <p className="font-extrabold tracking-tight">{wzorTitle(design.code)}</p>
          <p className="text-sm text-muted">
            {zonesLabel(design.product, params.usedPrintAreaIds)} · {feeLabel(design.usageFee)}
            {params.designModified ? " · zmieniony w edytorze" : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
            <Link href={`/wzory?produkt=${productSlugs[design.product]}`} className="underline underline-offset-4">
              Zmień wzór
            </Link>
            <button
              type="button"
              className="text-muted underline underline-offset-4 hover:text-ink"
              onClick={() => {
                if (window.confirm("Usunąć wzór z projektu? Arkusz będzie pusty.")) onRemove();
              }}
            >
              Usuń wzór
            </button>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm">
        <span className="font-semibold">
          {seller.priceFrom} × {work.qty} szt. {fee}
        </span>
        <span className="text-muted"> — cenę wzoru liczymy raz na pozycję.</span>
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy}
          className="rounded-xl bg-ink px-4 py-3 font-bold text-white hover:bg-[#2c2a26] disabled:opacity-60"
          onClick={() => void toCart()}
        >
          {busy ? "Zapisujemy plik…" : "Do koszyka"}
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-xl border border-ink px-4 py-3 font-bold text-ink hover:bg-paper disabled:opacity-60"
          onClick={onEdit}
        >
          Zmień w edytorze
        </button>
      </div>
    </section>
  );
}
