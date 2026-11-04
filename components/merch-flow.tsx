"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { EditorHandle } from "@/components/editor-canvas";
import { EditorLoader } from "@/components/editor-loader";
import { LoginPanel } from "@/components/login-panel";
import { ProductArt } from "@/components/product-art";
import { SiteFooter } from "@/components/site-footer";
import { CartWzorLine, WzorOrderFields } from "@/components/wzory/cart-wzor";
import { ChosenWzor } from "@/components/wzory/chosen-wzor";
import { WzoryStrip } from "@/components/wzory/wzory-strip";
import { dropForeignDesign, withoutDesign } from "@/lib/wzory/choose";
import { useWzorFonts } from "@/lib/wzory/fonts-client";
import {
  emptyOrder,
  initialWork,
  type PrintAreaId,
  type PrintFiles,
  type PublicUser,
  type SessionView,
  type WorkSnapshot,
} from "@/lib/work";

const EditorCanvas = dynamic(
  () => import("@/components/editor-canvas").then((mod) => mod.EditorCanvas),
  { ssr: false, loading: () => null },
);
import {
  productById,
  quantities,
  shirtColors,
  sizes,
  type ProductId,
} from "@/lib/catalog";
import { DEFAULT_MUG_MODEL_URL, DEFAULT_TSHIRT_MODEL_URL } from "@/components/souvenir3d/types";
import { seller } from "@/lib/seller";

const warmedModels = new Set<string>();

function warmModel(url: string) {
  if (warmedModels.has(url)) return;
  warmedModels.add(url);
  void fetch(url).catch(() => {
    warmedModels.delete(url);
  });
}

function warmEditor(urls: string[]) {
  void import("@/components/editor-canvas")
    .then(() => import("@/components/souvenir3d/GltfPrintModel"))
    .then((mod) => {
      for (const url of urls) mod.preloadPrintModel(url);
    })
    .catch(() => undefined);
}

function printZoneNames(work: WorkSnapshot) {
  const labels: Record<string, string> = { front: "przód", back: "tył", wrap: "obwód" };
  return (Object.keys(work.printFiles) as PrintAreaId[])
    .filter((id) => work.printFiles[id])
    .map((id) => labels[id] ?? id);
}

const finishes = [
  { id: "none", label: "Bez wykończenia" },
  { id: "matte", label: "Matowe" },
  { id: "gloss", label: "Błyszczące" },
] as const;

export function MerchFlow() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [designId, setDesignId] = useState<string | null>(null);
  const [work, setWork] = useState<WorkSnapshot>(() => initialWork());
  const [orderName, setOrderName] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [leaving, setLeaving] = useState<ProductId | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderBusy, setOrderBusy] = useState(false);
  const [canvasEpoch, setCanvasEpoch] = useState(0);
  const [printBusy, setPrintBusy] = useState(false);
  const [printNote, setPrintNote] = useState<string | null>(null);
  const editorApi = useRef<EditorHandle | null>(null);
  const editorKey = `${work.product}:${canvasEpoch}`;
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const [editorFailed, setEditorFailed] = useState(false);
  const editorOpen = work.step === "editor" && readyFor === editorKey && !editorFailed;
  const workRef = useRef(work);
  const readyRef = useRef(false);
  workRef.current = work;
  const fontsReady = useWzorFonts(work.design?.fonts);

  function updateWork(patch: (current: WorkSnapshot) => WorkSnapshot) {
    const next = patch(workRef.current);
    if (next === workRef.current) return;
    workRef.current = next;
    setWork(next);
  }

  function setOrder(patch: Partial<WorkSnapshot["order"]>) {
    updateWork((current) => ({
      ...current,
      placed: false,
      order: { ...emptyOrder(), ...current.order, ...patch, consentAt: "" },
    }));
  }

  function applySession(view: SessionView) {
    workRef.current = view.work;
    setWork(view.work);
    setUser(view.user);
    setDesignId(view.designId);
    setOrderName(view.user?.name ?? "");
    setCanvasEpoch((value) => value + 1);
  }

  useEffect(() => {
    let cancel = false;
    fetch("/api/session")
      .then((response) => {
        if (!response.ok) throw new Error("session");
        return response.json() as Promise<SessionView>;
      })
      .then((view) => {
        if (cancel) return;
        applySession(view);
        readyRef.current = true;
        setReady(true);
      })
      .catch(() => {
        if (!cancel) setBootError("Nie udało się otworzyć serwera");
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    warmModel(DEFAULT_TSHIRT_MODEL_URL);
    warmModel(DEFAULT_MUG_MODEL_URL);
    warmEditor([DEFAULT_TSHIRT_MODEL_URL, DEFAULT_MUG_MODEL_URL]);
  }, []);

  useEffect(() => {
    if (work.step === "editor") return;
    setReadyFor(null);
    setEditorFailed(false);
  }, [work.step]);

  useEffect(() => {
    setEditorFailed(false);
  }, [editorKey]);

  useEffect(() => {
    if (work.step !== "editor" || editorOpen || editorFailed) return;
    const timer = window.setTimeout(() => setEditorFailed(true), 20000);
    return () => window.clearTimeout(timer);
  }, [work.step, editorOpen, editorFailed, editorKey]);

  useEffect(() => {
    if (!ready) return;
    const body = JSON.stringify(workRef.current);
    const handle = window.setTimeout(() => {
      void fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })
        .then(async (response) => {
          if (!response.ok) {
            setSaveError(true);
            return;
          }
          const view = (await response.json()) as SessionView;
          setSaveError(false);
          setDesignId(view.designId);
        })
        .catch(() => setSaveError(true));
    }, 400);
    return () => window.clearTimeout(handle);
  }, [ready, work]);

  useEffect(() => {
    const flush = () => {
      if (!readyRef.current) return;
      void fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workRef.current),
        keepalive: true,
      });
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  async function logout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) return;
    applySession((await response.json()) as SessionView);
  }

  async function deleteOwnAccount() {
    if (!window.confirm("Usunąć konto i zapisany projekt? Nie da się tego cofnąć.")) return;
    const response = await fetch("/api/account", { method: "DELETE" });
    if (!response.ok) return;
    applySession((await response.json()) as SessionView);
  }

  async function openCart() {
    setPrintBusy(true);
    setPrintNote(null);
    const printFiles: PrintFiles = {};
    let failed = false;
    try {
      const exported = (await editorApi.current?.exportProduction()) ?? [];
      await fetch("/api/prints", { method: "DELETE" });
      for (const item of exported) {
        if (!("blob" in item)) {
          failed = true;
          continue;
        }
        const response = await fetch(`/api/prints?area=${encodeURIComponent(item.area)}`, {
          method: "POST",
          headers: { "Content-Type": "image/png" },
          body: item.blob,
        });
        if (!response.ok) {
          failed = true;
          continue;
        }
        const body = (await response.json()) as { area: PrintAreaId; file: PrintFiles[PrintAreaId] };
        if (body.file) printFiles[body.area] = body.file;
      }
      if (failed) setPrintNote("Nie udało się zapisać pliku do druku.");
    } catch {
      setPrintNote("Nie udało się zapisać pliku do druku.");
    } finally {
      setPrintBusy(false);
    }
    updateWork((current) => ({ ...current, cartFrom: "editor", step: "cart", printFiles }));
  }

  async function placeOrder(event: FormEvent) {
    event.preventDefault();
    setOrderError(null);
    if (!user) {
      setLoginOpen(true);
      return;
    }
    setOrderBusy(true);
    try {
      const profile = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orderName }),
      });
      if (!profile.ok) {
        setOrderError("Nie zapisano imienia");
        return;
      }
      const named = (await profile.json()) as SessionView;
      setUser(named.user);
      setOrderName(named.user?.name ?? orderName);
      const next: WorkSnapshot = { ...workRef.current, placed: true };
      const saved = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!saved.ok) {
        setOrderError("Nie zapisano zgłoszenia");
        return;
      }
      const view = (await saved.json()) as SessionView;
      applySession(view);
      if (!view.work.placed) {
        setOrderError(
          "Nie zapisano zgłoszenia. Uzupełnij e-mail, adres i obie zgody. NIP, jeśli podany, ma mieć 10 cyfr.",
        );
      }
    } finally {
      setOrderBusy(false);
    }
  }

  const product = productById(work.product);
  const zone = product.zones.find((item) => item.id === work.zone) ?? product.zones[0];
  const colorName = shirtColors.find((item) => item.value === work.color)?.label ?? "";
  const finishName = finishes.find((item) => item.id === work.finish)?.label ?? "";

  function openProduct(id: ProductId) {
    setLeaving(id);
    window.setTimeout(() => {
      const next = productById(id);
      updateWork((current) =>
        dropForeignDesign({
          ...current,
          product: id,
          zone: next.zones[0].id,
          step: "shop",
        }),
      );
      setLeaving(null);
    }, 480);
  }

  function startOwn() {
    if (workRef.current.design && !window.confirm("Zacząć od pustego arkusza? Wybrany wzór zniknie z projektu.")) return;
    updateWork((current) => ({ ...withoutDesign(current), step: "editor" }));
  }

  if (!ready || !fontsReady) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div className="grid gap-3">
          <p className="text-muted">{bootError ?? "Otwieramy…"}</p>
          {bootError ? (
            <button type="button" className="font-bold" onClick={() => window.location.reload()}>
              Jeszcze raz
            </button>
          ) : null}
        </div>
      </main>
    );
  }

  const account = (
    <AccountLinks
      user={user}
      onLogin={() => setLoginOpen(true)}
      onLogout={() => void logout()}
      onDelete={() => void deleteOwnAccount()}
    />
  );

  return (
    <main className="min-h-full">
      {work.step === "doors" ? (
        <section className="doors relative flex min-h-screen flex-col overflow-hidden md:flex-row">
          <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
            <a
              href="/prawne/regulamin"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink"
            >
              Prawne
            </a>
            {account}
          </div>
          <Door
            tone="dark"
            title="Koszulka"
            line={`Przód i tył · ${seller.priceFrom}`}
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
            title="Kubek"
            line={`Obwód · ${seller.priceFrom}`}
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

      {work.step === "shop" ? (
        <section className="rise">
          <Top
            onHome={() => updateWork((current) => ({ ...current, step: "doors" }))}
            onCart={() => updateWork((current) => ({ ...current, cartFrom: "shop", step: "cart" }))}
            account={account}
          />
          <div className="grid items-start gap-7 px-5 pb-10 md:items-center md:px-7 md:grid-cols-[1.15fr_0.85fr]">
            <div className="grid min-h-[240px] place-items-center rounded-[20px] border border-line bg-card md:min-h-[520px]">
              <ProductArt product={work.product} color={work.color} text="" size={300} hidePrint />
            </div>
            <div>
              <h1 className="text-[40px] font-extrabold tracking-tight">{product.name}</h1>
              <p className="mt-1.5 text-[15px] text-muted">
                {seller.city} · gotowe w {seller.leadTime}
              </p>
              <p className="mt-4 text-[28px] font-extrabold tracking-tight">{seller.priceFrom}</p>
              <p className="mt-1 text-sm text-muted">
                Cena wyjściowa brutto. Wiążąca cena i koszt dostawy — przed płatnością.
              </p>
              {work.product === "tshirt" ? (
                <>
                  <FieldLabel>Rozmiar</FieldLabel>
                  <Pills
                    values={sizes}
                    current={work.size}
                    onPick={(size) => updateWork((current) => ({ ...current, size }))}
                  />
                </>
              ) : (
                <>
                  <FieldLabel>Pojemność</FieldLabel>
                  <p className="text-sm font-semibold">330 ml</p>
                </>
              )}
              <FieldLabel>Kolor</FieldLabel>
              <div className="flex items-center gap-2.5">
                {shirtColors.map((swatch) => {
                  const selected = work.color === swatch.value;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      aria-label={swatch.label}
                      aria-pressed={selected}
                      className={`h-9 w-9 rounded-full border ${selected ? "border-ink ring-2 ring-ink ring-offset-2 ring-offset-paper" : "border-line"}`}
                      style={{ background: swatch.value }}
                      onClick={() => updateWork((current) => ({ ...current, color: swatch.value }))}
                    />
                  );
                })}
                <span className="ml-1 text-sm text-muted">{colorName}</span>
              </div>
              <FieldLabel>Nakład</FieldLabel>
              <Pills
                values={quantities}
                current={work.qty}
                format={(value) => `${value} szt.`}
                onPick={(qty) => updateWork((current) => ({ ...current, qty }))}
              />
              <FieldLabel>Wykończenie</FieldLabel>
              <Pills
                values={finishes.map((item) => item.label)}
                current={finishes.find((item) => item.id === work.finish)?.label ?? "Bez wykończenia"}
                onPick={(label) => {
                  const next = finishes.find((item) => item.label === label);
                  if (next) updateWork((current) => ({ ...current, finish: next.id }));
                }}
              />
              <p className="mt-2 text-xs text-muted">Tak będzie wyglądać powierzchnia nadruku.</p>
              {work.design ? (
                <ChosenWzor
                  work={work}
                  onEdit={() => updateWork((current) => ({ ...current, step: "editor" }))}
                  onRemove={() => updateWork(withoutDesign)}
                  onCart={(printFiles, previewUrl, note) => {
                    setPrintNote(note);
                    updateWork((current) => ({
                      ...current,
                      cartFrom: "shop",
                      step: "cart",
                      printFiles,
                      previewUrl: previewUrl ?? current.previewUrl,
                    }));
                  }}
                />
              ) : null}
              <button
                type="button"
                className="mt-6 w-full rounded-xl bg-ink px-4 py-4 text-base font-bold text-white hover:bg-[#2c2a26]"
                onClick={startOwn}
              >
                Zrób własny
              </button>
              <p className="mt-3 text-sm text-muted">Własny plik podepniemy razem z zamówieniem.</p>
            </div>
          </div>
          <WzoryStrip product={work.product} color={work.color} />
          <SiteFooter />
        </section>
      ) : null}

      {work.step === "editor" ? (
        <section className="relative flex h-dvh flex-col bg-paper text-ink">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
            <button
              type="button"
              className="text-sm text-muted"
              onClick={() => updateWork((current) => ({ ...current, step: "shop" }))}
            >
              Do rzeczy
            </button>
            <span className="text-sm font-semibold">{product.name}</span>
            <span className="hidden text-sm text-muted sm:inline">
              {work.product === "tshirt" ? `${work.size} · ` : "330 ml · "}
              {colorName} · {work.qty} szt. · {finishName}
            </span>
            <div className="flex-1" />
            <a href="/prawne/regulamin" className="text-sm text-muted hover:text-ink">
              Prawne
            </a>
            {saveError ? <span className="text-sm text-muted">Nie zapisano</span> : null}
            {work.quality.length > 0 ? <span className="text-sm text-muted">Uwagi do druku</span> : null}
            <span className="text-sm text-muted">{seller.priceFrom}</span>
            <button
              type="button"
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={printBusy}
              onClick={() => void openCart()}
            >
              {printBusy ? "Zapisujemy plik…" : "Do koszyka"}
            </button>
          </header>
          <EditorCanvas
            key={`${work.product}:${canvasEpoch}`}
            product={work.product}
            bodyColor={work.color}
            initialPages={work.pages}
            activeId={work.zone}
            onActiveId={(zoneId) => updateWork((current) => ({ ...current, zone: zoneId }))}
            onPreview={(url) =>
              updateWork((current) => (current.previewUrl === url ? current : { ...current, previewUrl: url }))
            }
            onPages={(pages) =>
              updateWork((current) =>
                JSON.stringify(current.pages) === JSON.stringify(pages) ? current : { ...current, pages, printFiles: {} },
              )
            }
            onIssues={(quality) =>
              updateWork((current) =>
                JSON.stringify(current.quality) === JSON.stringify(quality) ? current : { ...current, quality },
              )
            }
            onBind={(api) => {
              editorApi.current = api;
            }}
            onEditorReady={() => setReadyFor(editorKey)}
            onEditorFailed={() => setEditorFailed(true)}
          />
          {editorOpen ? null : (
            <EditorLoader
              failed={editorFailed}
              onLeave={() => updateWork((current) => ({ ...current, step: "shop" }))}
            />
          )}
        </section>
      ) : null}

      {work.step === "cart" ? (
        <>
        <section className="rise mx-auto max-w-3xl px-7 py-8">
          <button
            type="button"
            className="font-bold"
            onClick={() => updateWork((current) => ({ ...current, step: current.cartFrom }))}
          >
            {work.cartFrom === "shop" ? "← Do rzeczy" : "← Do edytora"}
          </button>
          <div className="mt-4 flex items-center justify-between gap-4">
            <h1 className="text-4xl font-extrabold tracking-tight">Koszyk</h1>
            {account}
          </div>
          <article className="mt-6 flex items-center gap-4 rounded-2xl border border-line bg-card p-4">
            {work.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={work.previewUrl} alt="" className="h-24 w-24 object-contain" style={{ background: work.color }} />
            ) : (
              <ProductArt product={work.product} color={work.color} text="" size={96} hidePrint />
            )}
            <div>
              <h2 className="text-xl font-extrabold">{product.name}</h2>
              <p className="text-muted">
                {[work.product === "tshirt" ? work.size : "330 ml", colorName, `nakład ${work.qty}`, zone.label, finishName]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-1 font-bold">{seller.priceFrom}</p>
              <p className="text-sm text-muted">Cena wyjściowa brutto. Dostawa — przed płatnością.</p>
              <CartWzorLine work={work} />
              {work.quality.length > 0 ? (
                <ul className="mt-2 grid gap-1 text-sm text-ink">
                  {work.quality.map((issue) => (
                    <li key={`${issue.areaId}-${issue.code}`}>{issue.message}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 text-sm text-muted">
                {printZoneNames(work).length > 0
                  ? `Plik do druku 300 dpi jest na serwerze ${seller.brand}: ${printZoneNames(work).join(", ")}.`
                  : "Plik do druku 300 dpi zapisze się w drodze z edytora."}
              </p>
              {printNote ? <p className="mt-2 text-sm text-ink">{printNote}</p> : null}
            </div>
          </article>
          <section className="mt-6 rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
            <h2 className="font-bold text-ink">Pola przyszłego zamówienia</h2>
            <p className="mt-1">Trzymane na serwerze {seller.brand}. Do CRM nie wychodzą.</p>
            <ul className="mt-3 grid gap-1">
              <li>rzecz: {product.name}</li>
              <li>{work.product === "tshirt" ? `rozmiar: ${work.size}` : "pojemność: 330 ml"}</li>
              <li>kolor rzeczy: {colorName}</li>
              <li>nakład: {work.qty}</li>
              <li>wykończenie: {finishName} — tylko rodzaj, bez szerokości rolki</li>
              <li>editorKind: souvenir_3d</li>
              <WzorOrderFields work={work} />
              <li>
                strefa: {zone.label}, {zone.widthMm}×{zone.heightMm} mm
              </li>
              <li>editorDraftToken: pojawi się, gdy szkic zacznie iść do CRM</li>
              <li>plik do druku: {printZoneNames(work).length > 0 ? printZoneNames(work).join(", ") : "jeszcze nie"}</li>
              {work.order.email ? <li>e-mail: {work.order.email}</li> : null}
              {work.order.street ? (
                <li>
                  adres: {work.order.street}, {work.order.postalCode} {work.order.city}
                </li>
              ) : null}
              {work.order.nip ? <li>NIP: {work.order.nip}</li> : null}
              {work.order.acceptTerms || work.order.acceptCustom || work.order.marketing ? (
                <>
                  <li>regulamin: {work.order.acceptTerms ? "tak" : "nie"}</li>
                  <li>rzecz indywidualna, bez 14 dni: {work.order.acceptCustom ? "tak" : "nie"}</li>
                  <li>marketing: {work.order.marketing ? "tak" : "nie"}</li>
                </>
              ) : null}
            </ul>
          </section>
          {user && designId ? (
            <p className="mt-4 text-sm text-muted">
              Własny projekt:{" "}
              <a className="font-semibold text-ink underline" href={`/m/${designId}`}>
                /m/{designId}
              </a>
            </p>
          ) : null}
          {saveError ? <p className="mt-4 text-sm text-muted">Nie zapisano</p> : null}
          {work.placed && user ? (
            <div className="mt-6 grid gap-3">
              <p className="rounded-2xl bg-ink px-4 py-4 text-white">
                Zgłoszenie zapisane na serwerze {seller.brand}. Płatności nie pobieramy i nie wysyłamy go do CRM. Umowa sprzedaży
                powstanie dopiero po podaniu ceny z podatkiem i dostawą oraz po płatności.
              </p>
              <OrderSummary order={work.order} />
              <button
                type="button"
                className="text-sm font-semibold"
                onClick={() =>
                  updateWork((current) => ({
                    ...current,
                    placed: false,
                    order: { ...current.order, consentAt: "" },
                  }))
                }
              >
                Popraw dane
              </button>
            </div>
          ) : user ? (
            <form className="mt-6 grid gap-3" onSubmit={(event) => void placeOrder(event)}>
              <label className="grid gap-1 text-sm font-bold">
                Imię
                <input
                  required
                  autoComplete="name"
                  placeholder="Jak się do Ciebie zwracać"
                  value={orderName}
                  onChange={(event) => setOrderName(event.target.value)}
                  className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium placeholder:text-muted"
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Telefon
                <input
                  readOnly
                  type="tel"
                  value={user.phone}
                  className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium"
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                E-mail
                <input
                  required
                  type="email"
                  autoComplete="email"
                  maxLength={120}
                  value={work.order.email}
                  onChange={(event) => setOrder({ email: event.target.value })}
                  className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium placeholder:text-muted"
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Ulica i numer
                <input
                  required
                  autoComplete="street-address"
                  maxLength={120}
                  value={work.order.street}
                  onChange={(event) => setOrder({ street: event.target.value })}
                  className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium placeholder:text-muted"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-bold">
                  Kod pocztowy
                  <input
                    required
                    autoComplete="postal-code"
                    inputMode="numeric"
                    pattern="\d{2}-\d{3}"
                    placeholder="00-001"
                    maxLength={6}
                    value={work.order.postalCode}
                    onChange={(event) => setOrder({ postalCode: event.target.value })}
                    className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium placeholder:text-muted"
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold">
                  Miejscowość
                  <input
                    required
                    autoComplete="address-level2"
                    maxLength={120}
                    value={work.order.city}
                    onChange={(event) => setOrder({ city: event.target.value })}
                    className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium placeholder:text-muted"
                  />
                </label>
              </div>
              <label className="grid gap-1 text-sm font-bold">
                NIP
                <span className="font-medium text-muted"> opcjonalnie, do faktury</span>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={13}
                  placeholder="10 cyfr"
                  value={work.order.nip}
                  onChange={(event) => setOrder({ nip: event.target.value })}
                  className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium placeholder:text-muted"
                />
              </label>
              <label className="flex items-start gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  required
                  checked={work.order.acceptTerms}
                  onChange={(event) => setOrder({ acceptTerms: event.target.checked })}
                  className="mt-1"
                />
                <span>
                  Akceptuję <a href="/prawne/regulamin" className="underline">regulamin</a>.
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  required
                  checked={work.order.acceptCustom}
                  onChange={(event) => setOrder({ acceptCustom: event.target.checked })}
                  className="mt-1"
                />
                <span>
                  Zamawiam rzecz na indywidualne zamówienie i przyjmuję do wiadomości, że tracę prawo odstąpienia od
                  umowy w ciągu 14 dni.{" "}
                  <a href="/prawne/odstapienie" className="underline">
                    Odstąpienie
                  </a>
                </span>
              </label>
              <p className="text-sm font-medium text-muted">
                Dane przetwarzamy według{" "}
                <a className="text-ink underline" href="/prawne/prywatnosc">
                  polityki prywatności
                </a>
                .
              </p>
              <label className="flex items-start gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={work.order.marketing}
                  onChange={(event) => setOrder({ marketing: event.target.checked })}
                  className="mt-1"
                />
                <span>
                  Chcę dostawać informacje o ofercie e-mailem lub SMS-em. To zgoda dobrowolna i nie jest warunkiem
                  zgłoszenia.
                </span>
              </label>
              {orderError ? <p className="text-sm text-ink">{orderError}</p> : null}
              <button
                type="submit"
                disabled={orderBusy}
                className="rounded-xl bg-ink px-4 py-4 font-bold text-white disabled:opacity-60"
              >
                Zapisz zgłoszenie
              </button>
              <p className="text-sm text-muted">
                Płatności nie pobieramy. To jeszcze nie jest zamówienie z obowiązkiem zapłaty.
              </p>
            </form>
          ) : (
            <div className="mt-6 grid gap-3">
              <p className="text-sm text-muted">
                Zgłoszenie i ponowne otwarcie projektu są dostępne po zalogowaniu. Płatności nie pobieramy.
              </p>
              <button
                type="button"
                className="rounded-xl bg-ink px-4 py-4 font-bold text-white"
                onClick={() => setLoginOpen(true)}
              >
                Zaloguj się i zapisz zgłoszenie
              </button>
            </div>
          )}
        </section>
        <SiteFooter />
        </>
      ) : null}

      {loginOpen ? (
        <LoginPanel
          onClose={() => setLoginOpen(false)}
          onSuccess={(view) => {
            applySession(view);
            setLoginOpen(false);
          }}
        />
      ) : null}
    </main>
  );
}

function AccountLinks({
  user,
  onLogin,
  onLogout,
  onDelete,
}: {
  user: PublicUser | null;
  onLogin: () => void;
  onLogout: () => void;
  onDelete: () => void;
}) {
  if (!user) {
    return (
      <button type="button" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink" onClick={onLogin}>
        Zaloguj się
      </button>
    );
  }
  return (
    <span className="flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">
      <span>{user.name}</span>
      <button type="button" className="text-muted" onClick={onLogout}>
        Wyloguj
      </button>
      <button type="button" className="text-muted" onClick={onDelete}>
        Usuń konto
      </button>
    </span>
  );
}

function OrderSummary({ order }: { order: WorkSnapshot["order"] }) {
  const when = order.consentAt && !Number.isNaN(Date.parse(order.consentAt))
    ? new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Warsaw" }).format(
        new Date(order.consentAt),
      )
    : "";
  return (
    <ul className="grid gap-1 text-sm text-muted">
      <li>e-mail: {order.email}</li>
      <li>
        adres: {order.street}, {order.postalCode} {order.city}
      </li>
      {order.nip ? <li>NIP: {order.nip}</li> : null}
      <li>regulamin: {order.acceptTerms ? "zaakceptowany" : "nie"}</li>
      <li>rzecz indywidualna, bez 14 dni: {order.acceptCustom ? "przyjęte" : "nie"}</li>
      <li>marketing: {order.marketing ? "tak" : "nie"}</li>
      {when ? <li>zapis zgód: {when}</li> : null}
    </ul>
  );
}

function Top({
  onHome,
  onCart,
  account,
}: {
  onHome: () => void;
  onCart: () => void;
  account: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-4 px-7 py-4">
      <button type="button" onClick={onHome} className="text-lg font-extrabold tracking-tight">
        {seller.brand}
      </button>
      <nav className="flex items-center gap-4 text-sm font-semibold text-muted">
        <button type="button" className="hover:text-ink" onClick={onHome}>
          Drzwi
        </button>
        {account}
        <button type="button" className="hover:text-ink" onClick={onCart}>
          Koszyk
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
        Wybierz
      </span>
    </button>
  );
}
