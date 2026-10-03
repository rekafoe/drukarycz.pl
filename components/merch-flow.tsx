"use client";

import { useState, type ReactNode } from "react";
import { ProductArt } from "@/components/product-art";
import {
  productById,
  quantities,
  shirtColors,
  sizes,
  type ProductId,
} from "@/lib/catalog";

type Step = "doors" | "shop" | "editor" | "cart";

type Draft = {
  product: ProductId;
  zone: string;
  size: string;
  color: string;
  qty: string;
  text: string;
};

const initialDraft: Draft = {
  product: "tshirt",
  zone: "front",
  size: "M",
  color: "#171614",
  qty: "1",
  text: "Ваш принт",
};

export function MerchFlow() {
  const [step, setStep] = useState<Step>("doors");
  const [leaving, setLeaving] = useState<ProductId | null>(null);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [placed, setPlaced] = useState(false);

  const product = productById(draft.product);
  const zone = product.zones.find((item) => item.id === draft.zone) ?? product.zones[0];
  const backEmpty = draft.product === "tshirt" && draft.zone === "back";

  function openProduct(id: ProductId) {
    setLeaving(id);
    window.setTimeout(() => {
      const next = productById(id);
      setDraft((current) => ({
        ...current,
        product: id,
        zone: next.zones[0].id,
      }));
      setLeaving(null);
      setStep("shop");
    }, 480);
  }

  return (
    <main className="min-h-full">
      {step === "doors" ? (
        <section className="doors flex min-h-screen overflow-hidden">
          <Door
            tone="dark"
            title="Футболка"
            line="Грудь и спина · от 5 р."
            leaving={leaving}
            self="tshirt"
            onPick={() => openProduct("tshirt")}
          >
            <div className="door-art">
              <ProductArt product="tshirt" color="#f4f1ea" text="" size={300} hidePrint />
            </div>
          </Door>
          <Door
            tone="light"
            title="Кружка"
            line="Обхват · от 5 р."
            leaving={leaving}
            self="mug"
            onPick={() => openProduct("mug")}
          >
            <div className="door-art door-art-late">
              <ProductArt product="mug" color="#f7f4ef" text="" size={260} hidePrint />
            </div>
          </Door>
        </section>
      ) : null}

      {step === "shop" ? (
        <section className="rise">
          <Top onHome={() => setStep("doors")} />
          <div className="grid items-center gap-7 px-7 pb-8 md:grid-cols-[1.15fr_0.85fr]">
            <div className="grid min-h-[520px] place-items-center rounded-[20px] border border-line bg-card">
              <ProductArt product={draft.product} color={draft.color} text="" size={300} hidePrint />
            </div>
            <div>
              <h1 className="text-[40px] font-extrabold tracking-tight">{product.name}</h1>
              <p className="mt-1.5 text-[15px] text-muted">Минск, Дзержинского 3Б · готово за 1–2 дня</p>
              <p className="mt-4 text-[28px] font-extrabold tracking-tight">от 5 р.</p>
              <FieldLabel>Размер</FieldLabel>
              <Pills values={sizes} current={draft.size} onPick={(size) => setDraft({ ...draft, size })} />
              <FieldLabel>Цвет</FieldLabel>
              <div className="flex gap-2">
                {shirtColors.map((swatch) => (
                  <button
                    key={swatch.id}
                    type="button"
                    aria-label={swatch.label}
                    className={`h-9 w-9 rounded-full border ${draft.color === swatch.value ? "border-ink shadow-[inset_0_0_0_1px_#1a1916]" : "border-line"}`}
                    style={{ background: swatch.value }}
                    onClick={() => setDraft({ ...draft, color: swatch.value })}
                  />
                ))}
              </div>
              <FieldLabel>Тираж</FieldLabel>
              <Pills values={quantities} current={draft.qty} onPick={(qty) => setDraft({ ...draft, qty })} />
              <button
                type="button"
                className="mt-6 w-full rounded-xl bg-ink px-4 py-4 text-base font-bold text-white"
                onClick={() => setStep("editor")}
              >
                Сделать свой
              </button>
              <button type="button" className="mt-2.5 text-muted underline decoration-1 underline-offset-[3px]">
                Свой файл
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {step === "editor" ? (
        <section className="flex h-screen flex-col bg-[#efece6]">
          <header className="flex h-16 items-center gap-3.5 border-b border-line bg-card px-4">
            <button type="button" className="font-bold" onClick={() => setStep("shop")}>
              ← К вещи
            </button>
            <strong>{product.name}</strong>
            <div className="flex rounded-full bg-paper p-0.5">
              {product.zones.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-sm font-bold ${draft.zone === item.id ? "bg-ink text-white" : ""}`}
                  onClick={() => setDraft({ ...draft, zone: item.id })}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <span className="font-extrabold">от 5 р.</span>
            <button
              type="button"
              className="rounded-xl bg-ink px-4 py-2.5 font-bold text-white"
              onClick={() => setStep("cart")}
            >
              В корзину
            </button>
          </header>
          <div className="grid min-h-0 flex-1 md:grid-cols-[240px_1fr_320px]">
            <aside className="border-r border-line bg-card p-4">
              <FieldLabel>Текст</FieldLabel>
              <input
                value={draft.text}
                maxLength={24}
                onChange={(event) => setDraft({ ...draft, text: event.target.value })}
                className="w-full rounded-[10px] border border-line bg-white px-3 py-2.5"
              />
              <FieldLabel>Цвет вещи</FieldLabel>
              <div className="flex gap-2">
                {shirtColors.map((swatch) => (
                  <button
                    key={swatch.id}
                    type="button"
                    aria-label={swatch.label}
                    className={`h-9 w-9 rounded-full border ${draft.color === swatch.value ? "border-ink shadow-[inset_0_0_0_1px_#1a1916]" : "border-line"}`}
                    style={{ background: swatch.value }}
                    onClick={() => setDraft({ ...draft, color: swatch.value })}
                  />
                ))}
              </div>
              <p className="mt-4 max-w-[220px] text-xs text-muted">
                Редактор зоны «{zone.label}», {zone.widthMm}×{zone.heightMm} мм. В печать уходит плоский лист. Превью справа только смотрит.
              </p>
            </aside>
            <div className="grid place-items-center p-5">
              <div
                className={`relative grid place-items-center rounded-lg bg-white shadow-[0_16px_40px_rgba(30,24,16,0.08)] ${
                  draft.product === "mug" ? "aspect-[20/8.5] w-[min(520px,92%)]" : "aspect-[3/4] w-[min(360px,86%)]"
                }`}
              >
                <p className="px-3 text-center text-[42px] font-extrabold tracking-tight break-words">
                  {draft.text || "Пусто"}
                </p>
                <span className="absolute bottom-3 text-xs text-muted">{zone.label}</span>
              </div>
            </div>
            <aside className="flex flex-col items-center justify-center gap-2 border-l border-line bg-card">
              <ProductArt
                product={draft.product}
                color={draft.color}
                text={backEmpty ? "" : draft.text}
                size={230}
                hidePrint={backEmpty}
              />
              <p className="max-w-[220px] text-center text-xs text-muted">
                {backEmpty ? "Спина пустая, пока на ней нет текста." : "Превью вещи. Печатается лист слева."}
              </p>
            </aside>
          </div>
        </section>
      ) : null}

      {step === "cart" ? (
        <section className="rise mx-auto max-w-3xl px-7 py-8">
          <button type="button" className="font-bold" onClick={() => setStep("editor")}>
            ← В редактор
          </button>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Корзина</h1>
          <article className="mt-6 flex items-center gap-4 rounded-2xl border border-line bg-card p-4">
            <ProductArt product={draft.product} color={draft.color} text={draft.text} size={96} />
            <div>
              <h2 className="text-xl font-extrabold">{product.name}</h2>
              <p className="text-muted">
                {draft.size} · тираж {draft.qty} · {zone.label}
              </p>
              <p className="mt-1 font-bold">от 5 р.</p>
              <p className="text-sm text-muted">Макет подготовлен в редакторе</p>
            </div>
          </article>
          {placed ? (
            <p className="mt-6 rounded-2xl bg-ink px-4 py-4 text-white">
              Заявка сохранена в этом браузере. В CRM её пока не отправляем — шов заказа заложим, когда скажете.
            </p>
          ) : (
            <form
              className="mt-6 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                setPlaced(true);
              }}
            >
              <label className="grid gap-1 text-sm font-bold">
                Имя
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium"
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Телефон
                <input
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium"
                />
              </label>
              <button type="submit" className="rounded-xl bg-ink px-4 py-4 font-bold text-white">
                Оформить
              </button>
            </form>
          )}
        </section>
      ) : null}
    </main>
  );
}

function Top({ onHome }: { onHome: () => void }) {
  return (
    <header className="flex items-center justify-between px-7 py-4">
      <button type="button" onClick={onHome} className="text-lg font-extrabold tracking-tight">
        merch.by
      </button>
      <nav className="flex gap-4 text-sm font-semibold text-muted">
        <span>Каталог</span>
        <span>Корзина</span>
      </nav>
    </header>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="mt-3.5 mb-2 text-[12px] font-bold tracking-[0.06em] text-muted uppercase">{children}</p>
  );
}

function Pills({
  values,
  current,
  onPick,
}: {
  values: readonly string[];
  current: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          className={`rounded-full border px-3.5 py-2 font-semibold ${
            value === current ? "border-ink shadow-[inset_0_0_0_1px_#1a1916]" : "border-line bg-card"
          }`}
          onClick={() => onPick(value)}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

function Door({
  tone,
  title,
  line,
  leaving,
  self,
  onPick,
  children,
}: {
  tone: "dark" | "light";
  title: string;
  line: string;
  leaving: ProductId | null;
  self: ProductId;
  onPick: () => void;
  children: ReactNode;
}) {
  const gone = leaving !== null && leaving !== self;
  const taken = leaving === self;
  return (
    <button
      type="button"
      onClick={onPick}
      className={`door flex min-h-screen flex-1 flex-col justify-end gap-2 overflow-hidden px-10 py-10 text-left ${
        tone === "dark" ? "bg-[#171614] text-[#f6f3ee]" : "bg-[#f6f3ee] text-[#171614]"
      } ${gone ? "door-leave" : ""} ${taken ? "door-take" : ""}`}
    >
      {children}
      <span className="text-[64px] leading-[0.95] font-extrabold tracking-tight">{title}</span>
      <span className="text-lg opacity-70">{line}</span>
      <span
        className={`mt-4 w-fit rounded-full px-4 py-3 font-bold ${
          tone === "dark" ? "bg-[#f6f3ee] text-[#171614]" : "bg-[#171614] text-[#f6f3ee]"
        }`}
      >
        Выбрать
      </span>
    </button>
  );
}
