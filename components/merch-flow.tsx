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

  const product = productById(draft.product);
  const zone = product.zones.find((item) => item.id === draft.zone) ?? product.zones[0];

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
              <FieldLabel>Отделка</FieldLabel>
              <Pills
                values={finishes.map((item) => item.label)}
                current={finishes.find((item) => item.id === draft.finish)?.label ?? "Без отделки"}
                onPick={(label) => {
                  const next = finishes.find((item) => item.label === label);
                  if (next) setDraft({ ...draft, finish: next.id });
                }}
              />
              <p className="mt-2 text-xs text-muted">Вид отделки. Ширину рулона здесь не выбирают.</p>
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
          <EditorCanvas
            key={draft.product}
            product={draft.product}
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
          <button type="button" className="font-bold" onClick={() => setStep("editor")}>
            ← В редактор
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
                {draft.size} · тираж {draft.qty} · {zone.label} · {finishes.find((item) => item.id === draft.finish)?.label}
              </p>
              <p className="mt-1 font-bold">от 5 р.</p>
              <p className="text-sm text-muted">Макет подготовлен в редакторе</p>
            </div>
          </article>
          <section className="mt-6 rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
            <h2 className="font-bold text-ink">Поля будущего заказа</h2>
            <p className="mt-1">Сейчас остаются в браузере. В CRM не отправляются.</p>
            <ul className="mt-3 grid gap-1">
              <li>вещь: {product.name}</li>
              <li>размер: {draft.size}</li>
              <li>цвет вещи: {shirtColors.find((item) => item.value === draft.color)?.label}</li>
              <li>тираж: {draft.qty}</li>
              <li>отделка: {finishes.find((item) => item.id === draft.finish)?.label} — только вид, без ширины рулона</li>
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
