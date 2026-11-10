"use client";

import { useState, type SVGProps } from "react";
import { quantities } from "@/lib/catalog";
import { parseQty, qtyMax, qtyMin, qtyString } from "@/lib/qty";

function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden {...props}>
      <path d="M6 12h12" />
    </svg>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden {...props}>
      <path d="M12 6v12M6 12h12" />
    </svg>
  );
}

function presetClass(selected: boolean) {
  return `rounded-xl border-2 px-4 py-2.5 text-[15px] font-bold transition-colors md:py-2 ${
    selected ? "border-(--a-mark) bg-[#16130F] text-[#F3EEE4]" : "border-[#16130F]/12 bg-white/60 hover:border-(--a-mark)"
  }`;
}

/** Stepper 1 szt. plus opcjonalne skróty 1 / 5 / 10 / 20. */
export function QtyField({
  qty,
  onChange,
  presets = quantities,
  id = "naklad",
}: {
  qty: string;
  onChange: (qty: string) => void;
  presets?: readonly string[];
  id?: string;
}) {
  const n = parseQty(qty);
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? qty;

  function commit(raw: string) {
    const next = qtyString(raw);
    setDraft(null);
    if (next !== qty) onChange(next);
  }

  function bump(delta: number) {
    commit(String(Math.min(qtyMax, Math.max(qtyMin, n + delta))));
  }

  return (
    <div>
      <p id={`${id}-hint`} className="sr-only">
        Nakład ustawiasz po jednej sztuce, od jednej. 1, 5, 10 i 20 sztuk to skróty, nie limit.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-labelledby={`${id}-hint`}
          className="inline-flex h-12 items-stretch overflow-hidden rounded-xl border-2 border-[#16130F]/12 bg-white md:h-11"
        >
          <button
            type="button"
            aria-label="Mniej o jedną sztukę"
            disabled={n <= qtyMin}
            className="grid w-12 place-items-center text-[#16130F] transition-colors hover:bg-[#2F5BFF]/10 hover:text-[#2F5BFF] disabled:cursor-not-allowed disabled:text-[#16130F]/25 disabled:hover:bg-transparent disabled:hover:text-[#16130F]/25 md:w-11"
            onClick={() => bump(-1)}
          >
            <MinusIcon />
          </button>
          <input
            id={id}
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            spellCheck={false}
            aria-label="Liczba sztuk"
            aria-valuemin={qtyMin}
            aria-valuemax={qtyMax}
            aria-valuenow={n}
            role="spinbutton"
            className="w-[4.5rem] border-x-2 border-[#16130F]/12 bg-transparent text-center text-[16px] font-extrabold tabular-nums text-[#16130F] outline-none md:text-[15px]"
            value={shown}
            onFocus={() => setDraft(qty)}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") {
                setDraft("");
                return;
              }
              if (!/^\d+$/.test(raw) || raw.length > 4) return;
              setDraft(raw);
              const parsed = Number(raw);
              if (parsed >= qtyMin) onChange(qtyString(parsed));
            }}
            onBlur={() => commit(draft ?? qty)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "ArrowUp") {
                event.preventDefault();
                bump(1);
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                bump(-1);
              }
            }}
          />
          <button
            type="button"
            aria-label="Więcej o jedną sztukę"
            disabled={n >= qtyMax}
            className="grid w-12 place-items-center text-[#16130F] transition-colors hover:bg-[#2F5BFF]/10 hover:text-[#2F5BFF] disabled:cursor-not-allowed disabled:text-[#16130F]/25 disabled:hover:bg-transparent disabled:hover:text-[#16130F]/25 md:w-11"
            onClick={() => bump(1)}
          >
            <PlusIcon />
          </button>
        </div>
        <span className="text-[14px] font-bold text-[#6b6358]">szt.</span>
      </div>
      {presets.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={qty === preset}
              className={presetClass(qty === preset)}
              onClick={() => commit(preset)}
            >
              {preset} szt.
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
