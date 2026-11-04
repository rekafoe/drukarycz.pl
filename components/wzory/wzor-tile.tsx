"use client";

import Link from "next/link";
import { WzorMockup } from "@/components/wzory/wzor-mockup";
import { feeLabel, wzorTitle, zonesLabel } from "@/lib/wzory/labels";
import type { WzorCard } from "@/lib/wzory/types";

export function WzorTile({ wzor, color }: { wzor: WzorCard; color: string }) {
  return (
    <Link
      href={`/wzory/${wzor.code}`}
      className="group grid h-full content-start gap-2.5 rounded-2xl border border-line bg-card p-2.5 transition-colors hover:border-ink"
    >
      <div className="aspect-[4/5] overflow-hidden rounded-xl bg-paper p-2 transition-transform group-hover:scale-[1.01]">
        <WzorMockup product={wzor.product} color={color} previews={wzor.previews} image={wzor.image} />
      </div>
      <div className="grid gap-1 px-1 pb-1">
        <p className="font-extrabold tracking-tight">{wzorTitle(wzor.code)}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="rounded-full border border-line px-2 py-0.5 text-[12px] font-semibold text-muted">
            {zonesLabel(wzor.product, wzor.usedPrintAreaIds)}
          </span>
          <span className={wzor.usageFee > 0 ? "font-semibold" : "font-semibold text-[#2f6b3a]"}>{feeLabel(wzor.usageFee)}</span>
        </div>
      </div>
    </Link>
  );
}

export function WzorTileSkeleton() {
  return (
    <div className="grid gap-2.5 rounded-2xl border border-line bg-card p-2.5" aria-hidden="true">
      <div className="aspect-[4/5] animate-pulse rounded-xl bg-paper" />
      <div className="grid gap-2 px-1 pb-1">
        <div className="h-4 w-3/4 animate-pulse rounded bg-paper" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-paper" />
      </div>
    </div>
  );
}
