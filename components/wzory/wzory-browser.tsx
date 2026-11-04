"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { startOwnDesign, useSessionColor } from "@/components/wzory/use-session-color";
import { WzorTile, WzorTileSkeleton } from "@/components/wzory/wzor-tile";
import { catalog, type ProductId } from "@/lib/catalog";
import { wzoryMessages } from "@/lib/wzory/labels";
import { productSlugs, type WzorCard, type WzorCategory } from "@/lib/wzory/types";

function countLabel(count: number) {
  const tens = count % 100;
  const ones = count % 10;
  if (count === 1) return "1 wzór";
  if (ones >= 2 && ones <= 4 && (tens < 12 || tens > 14)) return `${count} wzory`;
  return `${count} wzorów`;
}

type ListState = { product: ProductId; attempt: number; items: WzorCard[] | null; failed: boolean };

export function WzoryBrowser({ initialProduct }: { initialProduct: ProductId }) {
  const router = useRouter();
  const color = useSessionColor();
  const [product, setProduct] = useState<ProductId>(initialProduct);
  const [category, setCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<WzorCategory[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [list, setList] = useState<ListState>({ product: initialProduct, attempt: 0, items: null, failed: false });
  const [ownBusy, setOwnBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetch("/api/wzory/kategorie")
      .then((response) => (response.ok ? (response.json() as Promise<{ items: WzorCategory[] }>) : { items: [] }))
      .then((body) => {
        if (!cancel) setCategories(body.items);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [attempt]);

  useEffect(() => {
    let cancel = false;
    fetch(`/api/wzory?produkt=${productSlugs[product]}`)
      .then((response) => {
        if (!response.ok) throw new Error("wzory");
        return response.json() as Promise<{ items: WzorCard[] }>;
      })
      .then((body) => {
        if (!cancel) setList({ product, attempt, items: body.items, failed: false });
      })
      .catch(() => {
        if (!cancel) setList({ product, attempt, items: null, failed: true });
      });
    return () => {
      cancel = true;
    };
  }, [product, attempt]);

  function pickProduct(next: ProductId) {
    if (next === product) return;
    setProduct(next);
    setCategory(null);
    router.replace(`/wzory?produkt=${productSlugs[next]}`, { scroll: false });
  }

  const loading = list.product !== product || list.attempt !== attempt || (!list.items && !list.failed);
  const items = loading ? null : list.items;
  const shown = items?.filter((item) => category === null || item.categoryId === category) ?? [];

  return (
    <section className="px-5 pb-12 md:px-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px] leading-tight font-extrabold tracking-tight">Gotowe wzory</h1>
          <p className="mt-1 max-w-xl text-[15px] text-muted">
            Wybierz wzór i zamów bez zmian albo zmień tekst, zdjęcie i kolory w edytorze.
          </p>
        </div>
        <div className="flex rounded-full border border-line bg-card p-1" role="group" aria-label="Rzecz">
          {catalog.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === product}
              className={`rounded-full px-4 py-2 text-sm font-bold ${item.id === product ? "bg-ink text-white" : "text-ink hover:bg-paper"}`}
              onClick={() => pickProduct(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Kategorie">
        {[{ id: null, name: "Wszystkie" } as { id: number | null; name: string }, ...categories].map((item) => {
          const selected = item.id === category;
          return (
            <button
              key={item.id ?? "all"}
              type="button"
              aria-pressed={selected}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold ${
                selected ? "border-ink bg-ink text-white" : "border-line bg-card hover:border-ink"
              }`}
              onClick={() => setCategory(item.id)}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      {!loading && items ? <p className="mt-4 text-sm text-muted">{countLabel(shown.length)}</p> : null}

      {loading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }, (_, index) => (
            <WzorTileSkeleton key={index} />
          ))}
        </div>
      ) : list.failed ? (
        <div className="mt-6 grid justify-items-start gap-3 rounded-2xl border border-dashed border-line p-6" role="alert">
          <p className="font-semibold">{wzoryMessages.listError}</p>
          <button
            type="button"
            className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {wzoryMessages.retry}
          </button>
        </div>
      ) : shown.length === 0 ? (
        <div className="mt-6 grid justify-items-start gap-3 rounded-2xl border border-dashed border-line p-6">
          <p className="font-semibold">{wzoryMessages.emptyCategory}</p>
          {category !== null ? (
            <button
              type="button"
              className="rounded-full border border-ink px-3.5 py-2 text-sm font-semibold"
              onClick={() => setCategory(null)}
            >
              Wszystkie
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((item) => (
            <WzorTile key={item.id} wzor={item} color={color} />
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink px-5 py-5 text-white md:px-7">
        <div>
          <p className="text-lg font-extrabold">Wolisz zacząć od zera?</p>
          <p className="text-sm opacity-70">Pusty arkusz, Twój tekst i zdjęcie.</p>
        </div>
        <button
          type="button"
          disabled={ownBusy}
          className="rounded-xl bg-white px-5 py-3 font-bold text-ink disabled:opacity-60"
          onClick={() => {
            setOwnBusy(true);
            void startOwnDesign(productSlugs[product], router.push).then((ok) => {
              if (!ok) setOwnBusy(false);
            });
          }}
        >
          Zrób własny
        </button>
      </div>
    </section>
  );
}
