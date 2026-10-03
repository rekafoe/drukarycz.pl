"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { ProductArt } from "@/components/product-art";

const EditorCanvas = dynamic(
  () => import("@/components/editor-canvas").then((mod) => mod.EditorCanvas),
  { ssr: false, loading: () => <p className="p-6 text-muted">Открываем холст…</p> },
);
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
  finish: "none" | "matte" | "gloss";
  previewUrl: string | null;
};

const finishes = [
  { id: "none", label: "Без отделки" },
  { id: "matte", label: "Матовая" },
  { id: "gloss", label: "Глянцевая" },
] as const;

const initialDraft: Draft = {
  product: "tshirt",
  zone: "front",
  size: "M",
  color: "#171614",
  qty: "1",
  text: "Ваш принт",
  finish: "none",
  previewUrl: null,
};

export function MerchFlow() {
  const [step, setStep] = useState<Step>("doors");
  const [leaving, setLeaving] = useState<ProductId | null>(null);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [placed, setPlaced] = useState(false);
  const [cartFrom, setCartFrom] = useState<"shop" | "editor">("shop");

  const product = productById(draft.product);
  const zone = product.zones.find((item) => item.id === draft.zone) ?? product.zones[0];
  const colorName = shirtColors.find((item) => item.value === draft.color)?.label ?? "";
  const finishName = finishes.find((item) => item.id === draft.finish)?.label ?? "";

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
        <section className="doors flex min-h-screen flex-col overflow-hidden md:flex-row">
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
          <Top
            onHome={() => setStep("doors")}
            onCart={() => {
              setCartFrom("shop");
              setStep("cart");
            }}
          />
          <div className="grid items-start gap-7 px-5 pb-10 md:items-center md:px-7 md:grid-cols-[1.15fr_0.85fr]">
            <div className="grid min-h-[240px] place-items-center rounded-[20px] border border-line bg-card md:min-h-[520px]">
              <ProductArt product={draft.product} color={draft.color} text="" size={300} hidePrint />
            </div>
            <div>
              <h1 className="text-[40px] font-extrabold tracking-tight">{product.name}</h1>
              <p className="mt-1.5 text-[15px] text-muted">Минск, Дзержинского 3Б · готово за 1–2 дня</p>
              <p className="mt-4 text-[28px] font-extrabold tracking-tight">от 5 р.</p>
              {draft.product === "tshirt" ? (
                <>
                  <FieldLabel>Размер</FieldLabel>
                  <Pills values={sizes} current={draft.size} onPick={(size) => setDraft({ ...draft, size })} />
                </>
              ) : (
                <>
                  <FieldLabel>Объём</FieldLabel>
                  <p className="text-sm font-semibold">330 мл</p>
                </>
              )}
              <FieldLabel>Цвет</FieldLabel>
              <div className="flex items-center gap-2.5">
                {shirtColors.map((swatch) => {
                  const selected = draft.color === swatch.value;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      aria-label={swatch.label}
                      aria-pressed={selected}
                      className={`h-9 w-9 rounded-full border ${selected ? "border-ink ring-2 ring-ink ring-offset-2 ring-offset-paper" : "border-line"}`}
                      style={{ background: swatch.value }}
                      onClick={() => setDraft({ ...draft, color: swatch.value })}
                    />
                  );
                })}
                <span className="ml-1 text-sm text-muted">{colorName}</span>
              </div>
              <FieldLabel>Тираж</FieldLabel>
              <Pills
                values={quantities}
                current={draft.qty}
                format={(value) => `${value} шт.`}
                onPick={(qty) => setDraft({ ...draft, qty })}
              />
              <FieldLabel>Отделка</FieldLabel>
              <Pills
                values={finishes.map((item) => item.label)}
                current={finishes.find((item) => item.id === draft.finish)?.label ?? "Без отделки"}
                onPick={(label) => {
                  const next = finishes.find((item) => item.label === label);
                  if (next) setDraft({ ...draft, finish: next.id });
                }}
              />
              <p className="mt-2 text-xs text-muted">Как будет выглядеть поверхность печати.</p>
              <button
                type="button"
                className="mt-6 w-full rounded-xl bg-ink px-4 py-4 text-base font-bold text-white hover:bg-[#2c2a26]"
                onClick={() => setStep("editor")}
              >
                Сделать свой
              </button>
              <p className="mt-3 text-sm text-muted">Свой файл подключим вместе с заказом.</p>
            </div>
          </div>
        </section>
      ) : null}

      {step === "editor" ? (
        <section className="flex h-dvh flex-col bg-paper text-ink">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
            <button type="button" className="text-sm text-muted" onClick={() => setStep("shop")}>
              К вещи
            </button>
            <span className="text-sm font-semibold">{product.name}</span>
            <span className="hidden text-sm text-muted sm:inline">
              {draft.product === "tshirt" ? `${draft.size} · ` : "330 мл · "}
              {colorName} · {draft.qty} шт. · {finishName}
            </span>
            <div className="flex-1" />
            <span className="text-sm text-muted">от 5 р.</span>
            <button
              type="button"
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white"
              onClick={() => {
                setCartFrom("editor");
                setStep("cart");
              }}
            >
              В корзину
            </button>
          </header>
          <EditorCanvas
            key={draft.product}
            product={draft.product}
            bodyColor={draft.color}
            activeId={draft.zone}
            onActiveId={(zoneId) => setDraft((current) => ({ ...current, zone: zoneId }))}
            onPreview={(url) =>
              setDraft((current) => (current.previewUrl === url ? current : { ...current, previewUrl: url }))
            }
          />
        </section>
      ) : null}

      {step === "cart" ? (
        <section className="rise mx-auto max-w-3xl px-7 py-8">
          <button type="button" className="font-bold" onClick={() => setStep(cartFrom)}>
            {cartFrom === "shop" ? "← К вещи" : "← В редактор"}
          </button>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Корзина</h1>
          <article className="mt-6 flex items-center gap-4 rounded-2xl border border-line bg-card p-4">
            {draft.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.previewUrl} alt="" className="h-24 w-24 object-contain" />
            ) : (
              <ProductArt product={draft.product} color={draft.color} text="" size={96} hidePrint />
            )}
            <div>
              <h2 className="text-xl font-extrabold">{product.name}</h2>
              <p className="text-muted">
                {[draft.product === "tshirt" ? draft.size : "330 мл", colorName, `тираж ${draft.qty}`, zone.label, finishName]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-1 font-bold">от 5 р.</p>
              <p className="text-sm text-muted">
                {draft.previewUrl ? "Макет подготовлен в редакторе" : "На листе пока пусто"}
              </p>
            </div>
          </article>
          <section className="mt-6 rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
            <h2 className="font-bold text-ink">Поля будущего заказа</h2>
            <p className="mt-1">Сейчас остаются в браузере. В CRM не отправляются.</p>
            <ul className="mt-3 grid gap-1">
              <li>вещь: {product.name}</li>
              <li>{draft.product === "tshirt" ? `размер: ${draft.size}` : "объём: 330 мл"}</li>
              <li>цвет вещи: {colorName}</li>
              <li>тираж: {draft.qty}</li>
              <li>отделка: {finishName} — только вид, без ширины рулона</li>
              <li>editorKind: souvenir_3d</li>
              <li>зона: {zone.label}, {zone.widthMm}×{zone.heightMm} мм</li>
              <li>editorDraftToken: появится, когда черновик начнёт уходить в CRM</li>
            </ul>
          </section>
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
                  autoComplete="name"
                  placeholder="Как к вам обращаться"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium placeholder:text-muted"
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Телефон
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+375"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium placeholder:text-muted"
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

function Top({ onHome, onCart }: { onHome: () => void; onCart: () => void }) {
  return (
    <header className="flex items-center justify-between px-7 py-4">
      <button type="button" onClick={onHome} className="text-lg font-extrabold tracking-tight">
        merch.by
      </button>
      <nav className="flex gap-4 text-sm font-semibold text-muted">
        <button type="button" className="hover:text-ink" onClick={onHome}>
          Двери
        </button>
        <button type="button" className="hover:text-ink" onClick={onCart}>
          Корзина
        </button>
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
  format,
}: {
  values: readonly string[];
  current: string;
  onPick: (value: string) => void;
  format?: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => {
        const selected = value === current;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            className={`rounded-full border px-3.5 py-2 font-semibold ${
              selected ? "border-ink bg-ink text-white" : "border-line bg-card hover:border-ink"
            }`}
            onClick={() => onPick(value)}
          >
            {format ? format(value) : value}
          </button>
        );
      })}
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
      className={`door flex min-h-[52vh] flex-1 flex-col justify-end gap-2 overflow-hidden px-6 py-8 text-left md:min-h-screen md:px-10 md:py-10 ${
        tone === "dark" ? "bg-[#171614] text-[#f6f3ee]" : "bg-[#f6f3ee] text-[#171614]"
      } ${gone ? "door-leave" : ""} ${taken ? "door-take" : ""}`}
    >
      {children}
      <span className="text-[44px] leading-[0.95] font-extrabold tracking-tight md:text-[64px]">{title}</span>
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
