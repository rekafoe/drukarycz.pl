"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DEFAULT_PRINT_AREAS_TSHIRT } from "@/components/souvenir3d/types";
import { startOwnDesign, useSessionColor } from "@/components/wzory/use-session-color";
import { WzorMockup } from "@/components/wzory/wzor-mockup";
import { editorPaths, merchDest, productById, productPaths } from "@/lib/catalog";
import { seller } from "@/lib/seller";
import type { PrintAreaId } from "@/lib/work";
import type { ChoiceMode } from "@/lib/wzory/choose";
import { feeLabel, wzorTitle, zonesLabel } from "@/lib/wzory/labels";
import { productSlugs, type WzorCard } from "@/lib/wzory/types";

const Souvenir3dPreview = dynamic(
  () => import("@/components/souvenir3d/Souvenir3dPreview").then((mod) => mod.Souvenir3dPreview),
  { ssr: false, loading: () => null },
);

export function WzorCardView({ wzor, asIs, categoryName }: { wzor: WzorCard; asIs: boolean; categoryName: string | null }) {
  const router = useRouter();
  const color = useSessionColor();
  const product = productById(wzor.product);
  const shirt = wzor.product === "tshirt";
  const [view, setView] = useState<PrintAreaId>(wzor.usedPrintAreaIds[0] ?? (shirt ? "front" : "wrap"));
  const [modelReady, setModelReady] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);
  const [busy, setBusy] = useState<ChoiceMode | "own" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textures = useMemo(() => ({ ...wzor.previews }), [wzor.previews]);
  // Камера 3D-кружки смотрит на начало обёртки, а не на её середину, поэтому кружка остаётся плоским мокапом.
  const show3d = shirt && !modelFailed && Object.keys(textures).length > 0;

  async function choose(mode: ChoiceMode) {
    setBusy(mode);
    setError(null);
    try {
      const response = await fetch(`/api/wzory/${wzor.id}/wybierz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (response.ok) {
        const body = (await response.json().catch(() => ({}))) as { path?: unknown };
        const fallback = mode === "edit" ? editorPaths[wzor.product] : productPaths[wzor.product];
        router.push(merchDest(body.path, fallback));
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Nie udało się wybrać wzoru.");
    } catch {
      setError("Nie udało się wybrać wzoru.");
    }
    setBusy(null);
  }

  return (
    <div className="grid items-start gap-6 px-5 md:grid-cols-[1.15fr_0.85fr] md:gap-8 md:px-7">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-[20px] border border-line bg-[#e7e1d6] md:aspect-auto md:h-[min(620px,72vh)]">
          <div
            className={`absolute inset-0 p-6 transition-opacity duration-500 md:p-10 ${modelReady && show3d ? "opacity-0" : "opacity-100"}`}
            aria-hidden={modelReady && show3d}
          >
            <WzorMockup product={wzor.product} color={color} previews={wzor.previews} image={wzor.image} view={view} />
          </div>
          {show3d ? (
            <div className={`absolute inset-0 transition-opacity duration-500 ${modelReady ? "opacity-100" : "opacity-0"}`}>
              <Souvenir3dPreview
                printAreas={DEFAULT_PRINT_AREAS_TSHIRT}
                activePrintAreaId={view}
                texturesByArea={textures}
                bodyColor={color}
                caption=""
                onModelReady={() => setModelReady(true)}
                onModelError={() => setModelFailed(true)}
              />
            </div>
          ) : null}
          {shirt && wzor.usedPrintAreaIds.length > 1 ? (
            <div className="absolute top-3 left-3 flex rounded-full bg-white/90 p-1 shadow-sm" role="group" aria-label="Strona">
              {(["front", "back"] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  aria-pressed={view === side}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${view === side ? "bg-(--a-cta) text-white" : "text-ink"}`}
                  onClick={() => setView(side)}
                >
                  {side === "front" ? "Przód" : "Tył"}
                </button>
              ))}
            </div>
          ) : null}
          {modelReady && show3d ? (
            <p className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-white/80 px-3 py-1 text-[12px] font-semibold text-muted">
              Przeciągnij, żeby obrócić
            </p>
          ) : null}
        </div>
        {!shirt && wzor.previews.wrap ? (
          <p className="mt-2 text-sm text-muted">Pod kubkiem cały nadruk dookoła: od ucha do ucha.</p>
        ) : null}
      </div>

      <div className="pb-28 md:pb-0">
        <p className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">Gotowy wzór · {product.name}</p>
        <h1 className="font-poster mt-1 text-[40px] leading-[0.95] font-black tracking-tight md:text-[52px]">{wzorTitle(wzor.code)}</h1>
        <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
          {categoryName ? <span className="rounded-full border border-line bg-card px-3 py-1">{categoryName}</span> : null}
          <span className="rounded-full border border-line bg-card px-3 py-1">{zonesLabel(wzor.product, wzor.usedPrintAreaIds)}</span>
        </div>
        <p className="mt-5 text-[28px] font-extrabold tracking-tight">{feeLabel(wzor.usageFee)}</p>
        <p className="mt-1 text-sm text-muted">
          {wzor.usageFee > 0 ? "Cenę wzoru doliczamy raz do pozycji, bez względu na nakład. " : ""}
          {product.name} {seller.priceFrom}. Rozmiar, kolor i nakład wybierzesz w sklepie.
        </p>
        <ul className="mt-5 grid gap-3 text-[15px]">
          <li>
            <span className="font-bold">Zamów bez zmian</span>
            <span className="text-muted"> — wracasz do sklepu z tym wzorem i od razu idziesz do koszyka.</span>
          </li>
          <li>
            <span className="font-bold">Zmień w edytorze</span>
            <span className="text-muted"> — zmienisz tekst, zdjęcie i kolory. W koszyku będzie Twoja wersja.</span>
          </li>
        </ul>
        {!asIs ? (
          <p className="mt-4 text-sm text-ink">Ten wzór trzeba najpierw otworzyć w edytorze: nie wszystkie czcionki są gotowe.</p>
        ) : null}
        {error ? (
          <p className="mt-4 text-sm font-semibold text-ink" role="alert">
            {error}
          </p>
        ) : null}
        <div className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 gap-2 border-t border-line bg-[#F3EEE4]/95 p-3 backdrop-blur md:static md:mt-6 md:grid-cols-1 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          {asIs ? (
            <button
              type="button"
              disabled={busy !== null}
              className="btn-kobalt py-4"
              onClick={() => void choose("as-is")}
            >
              {busy === "as-is" ? "Chwileczkę…" : "Zamów bez zmian"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy !== null}
            className={`btn-ghost py-4 ${asIs ? "" : "col-span-2 md:col-span-1"}`}
            onClick={() => void choose("edit")}
          >
            {busy === "edit" ? "Otwieramy edytor…" : "Zmień w edytorze"}
          </button>
        </div>
        <p className="mt-4 text-sm text-muted">
          Wolisz od zera?{" "}
          <button
            type="button"
            disabled={busy !== null}
            className="font-bold text-(--a-mark) underline underline-offset-4"
            onClick={() => {
              setBusy("own");
              void startOwnDesign(productSlugs[wzor.product], router.push).then((ok) => {
                if (!ok) setBusy(null);
              });
            }}
          >
            Zrób własny
          </button>
        </p>
      </div>
    </div>
  );
}
