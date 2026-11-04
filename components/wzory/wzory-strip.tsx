"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WzorTile, WzorTileSkeleton } from "@/components/wzory/wzor-tile";
import type { ProductId } from "@/lib/catalog";
import { productSlugs, type WzorCard } from "@/lib/wzory/types";

const STRIP_LIMIT = 8;

/** Полоса «Gotowe wzory» под «Zrób własny». При ошибке или пустом списке просто не показывается. */
export function WzoryStrip({ product, color }: { product: ProductId; color: string }) {
  const slug = productSlugs[product];
  const [state, setState] = useState<{ slug: string; items: WzorCard[] | null; failed: boolean }>({
    slug,
    items: null,
    failed: false,
  });

  useEffect(() => {
    let cancel = false;
    fetch(`/api/wzory?produkt=${slug}`)
      .then((response) => {
        if (!response.ok) throw new Error("wzory");
        return response.json() as Promise<{ items: WzorCard[] }>;
      })
      .then((body) => {
        if (!cancel) setState({ slug, items: body.items, failed: false });
      })
      .catch(() => {
        if (!cancel) setState({ slug, items: null, failed: true });
      });
    return () => {
      cancel = true;
    };
  }, [slug]);

  const loading = state.slug !== slug || (!state.items && !state.failed);
  if (!loading && (state.failed || !state.items?.length)) return null;
  const items = loading ? [] : (state.items ?? []).slice(0, STRIP_LIMIT);

  return (
    <section className="px-5 pb-10 md:px-7" aria-labelledby="gotowe-wzory" aria-busy={loading}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="gotowe-wzory" className="text-2xl font-extrabold tracking-tight">
            Gotowe wzory
          </h2>
          <p className="mt-0.5 text-sm text-muted">Zamów bez zmian albo zmień tekst i zdjęcie w edytorze.</p>
        </div>
        <Link href={`/wzory?produkt=${slug}`} className="shrink-0 text-sm font-bold underline underline-offset-4">
          Zobacz wszystkie
        </Link>
      </div>
      <div className="-mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:-mx-7 md:px-7">
        {loading
          ? Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="w-[44%] shrink-0 sm:w-[210px]">
                <WzorTileSkeleton />
              </div>
            ))
          : items.map((item) => (
              <div key={item.id} className="w-[44%] shrink-0 snap-start sm:w-[210px]">
                <WzorTile wzor={item} color={color} />
              </div>
            ))}
      </div>
    </section>
  );
}
