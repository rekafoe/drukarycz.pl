"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowIcon,
  BagIcon,
  BrandMark,
  PriceChip,
  coralButton,
  fieldInput,
  inkButton,
} from "@/components/brand";
import type { EditorHandle } from "@/components/editor-canvas";
import { EditorLoader } from "@/components/editor-loader";
import { LoginPanel } from "@/components/login-panel";
import { ProductArt, ProductStage } from "@/components/product-art";
import { SiteFooter } from "@/components/site-footer";
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
  catalog,
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

const productLines: Record<ProductId, string> = {
  tshirt: "Nadruk z przodu i z tyłu",
  mug: "Nadruk dookoła · 330 ml",
};

function zoneSizes(id: ProductId) {
  return productById(id)
    .zones.map((item) => `${item.label} ${item.widthMm}×${item.heightMm} mm`)
    .join(" · ");
}

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
      updateWork((current) => ({
        ...current,
        product: id,
        zone: next.zones[0].id,
        step: "shop",
      }));
      setLeaving(null);
    }, 480);
  }

  function switchProduct(id: ProductId) {
    const next = productById(id);
    updateWork((current) =>
      current.product === id && current.step === "shop"
        ? current
        : { ...current, product: id, zone: next.zones[0].id, step: "shop" },
    );
  }

  if (!ready) {
    return (
      <main className="halftone-ink grid min-h-dvh place-items-center bg-cream px-6 text-center text-poster">
        <div className="grid justify-items-center gap-5" role="status">
          <BrandMark className="text-3xl md:text-4xl" />
          {bootError ? (
            <>
              <p className="max-w-xs text-muted">{bootError}. Sprawdź połączenie i spróbuj jeszcze raz.</p>
              <button type="button" className={`${inkButton} px-6 py-3`} onClick={() => window.location.reload()}>
                Jeszcze raz
              </button>
            </>
          ) : (
            <>
              <span className="relative h-1 w-40 overflow-hidden rounded-full bg-line" aria-hidden="true">
                <span className="boot-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-coral" />
              </span>
              <p className="text-sm text-muted">Otwieramy…</p>
            </>
          )}
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
        <section className="doors relative flex min-h-dvh flex-col overflow-hidden md:flex-row">
          <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-5 py-4 md:px-10 md:py-6">
            <BrandMark className="pointer-events-auto text-lg text-cream md:text-2xl" />
            <div className="pointer-events-auto flex items-center gap-2">
              <a
                href="/prawne/regulamin"
                className="rounded-full border border-poster/10 bg-white px-3.5 py-2 text-sm font-semibold whitespace-nowrap text-poster hover:border-poster sm:px-4"
              >
                Prawne
              </a>
              {account}
            </div>
          </header>
          <Door
            tone="dark"
            title="Koszulka"
            line={productLines.tshirt}
            leaving={leaving}
            self="tshirt"
            onPick={() => openProduct("tshirt")}
          >
            <ProductStage
              product="tshirt"
              color="#171614"
              tilt={-6}
              className="door-art w-[min(46vw,25dvh)] md:w-[min(30vw,46dvh,440px)]"
            />
          </Door>
          <Door
            tone="light"
            title="Kubek"
            line={productLines.mug}
            leaving={leaving}
            self="mug"
            onPick={() => openProduct("mug")}
          >
            <ProductStage
              product="mug"
              color="#f7f4ef"
              board="clay"
              tilt={5}
              className="door-art door-art-late w-[min(46vw,25dvh)] md:w-[min(30vw,46dvh,440px)]"
            />
          </Door>
        </section>
      ) : null}

      {work.step === "shop" ? (
        <>
        <section className="rise min-h-dvh bg-cream pb-24 text-poster md:pb-0">
          <Top
            product={work.product}
            onProduct={switchProduct}
            onHome={() => updateWork((current) => ({ ...current, step: "doors" }))}
            onCart={() => updateWork((current) => ({ ...current, cartFrom: "shop", step: "cart" }))}
            account={account}
          />
          <div className="mx-4 mt-3 grid grid-cols-2 rounded-full border border-line bg-white p-1 md:hidden">
            {catalog.map((item) => {
              const selected = item.id === work.product;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  className={`rounded-full py-2 text-sm font-bold ${selected ? "bg-poster text-cream" : "text-muted"}`}
                  onClick={() => switchProduct(item.id)}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
          <div className="mx-auto grid max-w-7xl items-start gap-6 px-4 pt-4 pb-10 md:px-7 md:pt-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-12">
            <div className="on-poster halftone relative grid min-h-[300px] place-items-center overflow-hidden rounded-[28px] bg-poster px-4 py-10 sm:min-h-[440px] lg:sticky lg:top-24 lg:min-h-[620px]">
              <span className="absolute top-4 left-4 rounded-full border border-cream/15 px-3 py-1 text-xs font-semibold text-cream/70">
                {zoneSizes(work.product)}
              </span>
              <ProductStage
                key={work.product}
                product={work.product}
                color={work.color}
                board={work.product === "mug" ? "clay" : "board"}
                tilt={work.product === "mug" ? 4 : -4}
                className="rise w-[min(64vw,300px)] sm:w-[360px] lg:w-[min(36vw,500px)]"
              />
              <span className="absolute bottom-4 left-4 text-xs text-cream/55">Przykładowy nadruk. Swój zrobisz w edytorze.</span>
            </div>
            <div className="lg:py-2">
              <p className="text-[12px] font-bold tracking-[0.16em] text-muted uppercase">{productLines[work.product]}</p>
              <h1 className="mt-2 font-display text-[40px] leading-[0.95] font-extrabold tracking-[-0.03em] md:text-[60px]">
                {product.name}
              </h1>
              <p className="mt-3 text-[15px] text-muted">
                {seller.city} · gotowe w {seller.leadTime}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <PriceChip size="lg" />
                <p className="max-w-[300px] text-sm leading-snug text-muted">
                  Cena wyjściowa brutto. Wiążąca cena i koszt dostawy — przed płatnością.
                </p>
              </div>
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
                  <p className="w-fit rounded-full border border-poster bg-poster px-3.5 py-2 font-semibold text-cream">330 ml</p>
                </>
              )}
              <FieldLabel>Kolor</FieldLabel>
              <div className="flex items-center gap-3">
                {shirtColors.map((swatch) => {
                  const selected = work.color === swatch.value;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      aria-label={swatch.label}
                      aria-pressed={selected}
                      className={`h-10 w-10 rounded-full border transition-transform hover:scale-105 ${selected ? "border-poster ring-2 ring-poster ring-offset-2 ring-offset-cream" : "border-poster/20"}`}
                      style={{ background: swatch.value }}
                      onClick={() => updateWork((current) => ({ ...current, color: swatch.value }))}
                    />
                  );
                })}
                <span className="ml-1 text-sm font-semibold text-muted">{colorName}</span>
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
              <button
                type="button"
                className={`${coralButton} mt-7 hidden w-full px-5 py-4 text-lg md:flex`}
                onClick={() => updateWork((current) => ({ ...current, step: "editor" }))}
              >
                Zrób własny
                <ArrowIcon className="h-5 w-5" />
              </button>
              <p className="mt-3 text-sm text-muted">Własny plik podepniemy razem z zamówieniem.</p>
              <ul className="mt-7 grid gap-3 border-t border-line pt-6 text-sm sm:grid-cols-3">
                <ShopFact title={`Gotowe w ${seller.leadTime}`} line={`Miejsce druku: ${seller.city}`} />
                <ShopFact title="Od 1 sztuki" line="Bez minimalnego nakładu" />
                <ShopFact title="Plik 300 dpi" line="Edytor ostrzeże przed słabą jakością" />
              </ul>
            </div>
          </div>
          <SiteFooter />
        </section>
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-cream/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
          <PriceChip />
          <button
            type="button"
            className={`${coralButton} flex-1 px-4 py-3.5 text-base`}
            onClick={() => updateWork((current) => ({ ...current, step: "editor" }))}
          >
            Zrób własny
            <ArrowIcon />
          </button>
        </div>
        </>
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
        <section className="rise min-h-dvh bg-cream text-poster">
          <Top
            product={work.product}
            onProduct={switchProduct}
            onHome={() => updateWork((current) => ({ ...current, step: "doors" }))}
            onCart={() => undefined}
            current="cart"
            account={account}
          />
          <div className="mx-auto max-w-6xl px-4 pt-6 pb-14 md:px-7 md:pt-8">
            <button
              type="button"
              className="text-sm font-semibold text-muted hover:text-poster"
              onClick={() => updateWork((current) => ({ ...current, step: current.cartFrom }))}
            >
              {work.cartFrom === "shop" ? "← Do rzeczy" : "← Do edytora"}
            </button>
            <h1 className="mt-3 font-display text-[40px] leading-none font-extrabold tracking-[-0.03em] md:text-[56px]">
              Koszyk
            </h1>
            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
              <div className="grid min-w-0 gap-6">
                <article className="grid gap-4 rounded-[24px] border border-line bg-white p-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:p-5">
                  <div
                    className="grid aspect-square w-full max-w-[200px] place-items-center overflow-hidden rounded-2xl sm:max-w-none"
                    style={{ background: work.previewUrl ? work.color : "var(--board)" }}
                  >
                    {work.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={work.previewUrl} alt="" className="h-full w-full object-contain p-2" />
                    ) : (
                      <ProductArt product={work.product} color={work.color} text="" size={112} hidePrint />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="font-display text-2xl font-extrabold tracking-tight">{product.name}</h2>
                      <PriceChip />
                    </div>
                    <p className="mt-1 text-muted">
                      {[work.product === "tshirt" ? work.size : "330 ml", colorName, `nakład ${work.qty}`, zone.label, finishName]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1 text-sm text-muted">Cena wyjściowa brutto. Dostawa — przed płatnością.</p>
                    {work.previewUrl ? (
                      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
                        Projekt przygotowany w edytorze
                        <button
                          type="button"
                          className="text-muted underline underline-offset-2 hover:text-poster"
                          onClick={() => updateWork((current) => ({ ...current, step: "editor" }))}
                        >
                          Popraw projekt
                        </button>
                      </p>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-poster/25 bg-cream p-4">
                        <p className="font-bold">Arkusz jest jeszcze pusty</p>
                        <p className="mt-1 text-sm text-muted">Dodaj tekst albo zdjęcie. Podgląd pojawi się tutaj.</p>
                        <button
                          type="button"
                          className={`${coralButton} mt-3 px-4 py-2.5 text-sm`}
                          onClick={() => updateWork((current) => ({ ...current, step: "editor" }))}
                        >
                          Zrób własny
                          <ArrowIcon />
                        </button>
                      </div>
                    )}
                    {work.quality.length > 0 ? (
                      <ul className="mt-3 grid gap-1.5 rounded-2xl bg-sun/25 p-3 text-sm">
                        {work.quality.map((issue) => (
                          <li key={`${issue.areaId}-${issue.code}`} className="flex gap-2">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" aria-hidden="true" />
                            {issue.message}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="mt-3 text-sm text-muted">
                      {printZoneNames(work).length > 0
                        ? `Plik do druku 300 dpi jest na serwerze ${seller.brand}: ${printZoneNames(work).join(", ")}.`
                        : "Plik do druku 300 dpi zapisze się w drodze z edytora."}
                    </p>
                    {printNote ? <p className="mt-2 text-sm font-semibold text-coral">{printNote}</p> : null}
                  </div>
                </article>

                {work.placed && user ? (
                  <div className="grid gap-4">
                    <div className="on-poster rounded-[24px] bg-poster p-5 text-cream md:p-6">
                      <span className="inline-flex rounded-md bg-sun px-2 py-0.5 text-xs font-extrabold tracking-wide text-poster uppercase">
                        Zapisane
                      </span>
                      <p className="mt-3 leading-relaxed">
                        Zgłoszenie zapisane na serwerze {seller.brand}. Płatności nie pobieramy i nie wysyłamy go do CRM.
                        Umowa sprzedaży powstanie dopiero po podaniu ceny z podatkiem i dostawą oraz po płatności.
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-line bg-white p-5">
                      <OrderSummary order={work.order} />
                      <button
                        type="button"
                        className="mt-4 text-sm font-semibold underline underline-offset-2"
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
                  </div>
                ) : user ? (
                  <form
                    className="grid gap-4 rounded-[24px] border border-line bg-white p-5 md:p-6"
                    onSubmit={(event) => void placeOrder(event)}
                  >
                    <h2 className="font-display text-xl font-extrabold tracking-tight">Dane do zgłoszenia</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-1.5 text-sm font-bold">
                        Imię
                        <input
                          required
                          autoComplete="name"
                          placeholder="Jak się do Ciebie zwracać"
                          value={orderName}
                          onChange={(event) => setOrderName(event.target.value)}
                          className={fieldInput}
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm font-bold">
                        Telefon
                        <input readOnly type="tel" value={user.phone} className={`${fieldInput} bg-cream`} />
                      </label>
                    </div>
                    <label className="grid gap-1.5 text-sm font-bold">
                      E-mail
                      <input
                        required
                        type="email"
                        autoComplete="email"
                        maxLength={120}
                        value={work.order.email}
                        onChange={(event) => setOrder({ email: event.target.value })}
                        className={fieldInput}
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm font-bold">
                      Ulica i numer
                      <input
                        required
                        autoComplete="street-address"
                        maxLength={120}
                        value={work.order.street}
                        onChange={(event) => setOrder({ street: event.target.value })}
                        className={fieldInput}
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
                      <label className="grid gap-1.5 text-sm font-bold">
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
                          className={fieldInput}
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm font-bold">
                        Miejscowość
                        <input
                          required
                          autoComplete="address-level2"
                          maxLength={120}
                          value={work.order.city}
                          onChange={(event) => setOrder({ city: event.target.value })}
                          className={fieldInput}
                        />
                      </label>
                    </div>
                    <label className="grid gap-1.5 text-sm font-bold">
                      <span>
                        NIP <span className="font-medium text-muted">opcjonalnie, do faktury</span>
                      </span>
                      <input
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={13}
                        placeholder="10 cyfr"
                        value={work.order.nip}
                        onChange={(event) => setOrder({ nip: event.target.value })}
                        className={fieldInput}
                      />
                    </label>
                    <div className="grid gap-3 rounded-2xl bg-cream p-4">
                      <label className="flex items-start gap-3 text-sm font-medium">
                        <input
                          type="checkbox"
                          required
                          checked={work.order.acceptTerms}
                          onChange={(event) => setOrder({ acceptTerms: event.target.checked })}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[#16130f]"
                        />
                        <span>
                          Akceptuję <a href="/prawne/regulamin" className="underline">regulamin</a>.
                        </span>
                      </label>
                      <label className="flex items-start gap-3 text-sm font-medium">
                        <input
                          type="checkbox"
                          required
                          checked={work.order.acceptCustom}
                          onChange={(event) => setOrder({ acceptCustom: event.target.checked })}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[#16130f]"
                        />
                        <span>
                          Zamawiam rzecz na indywidualne zamówienie i przyjmuję do wiadomości, że tracę prawo odstąpienia od
                          umowy w ciągu 14 dni.{" "}
                          <a href="/prawne/odstapienie" className="underline">
                            Odstąpienie
                          </a>
                        </span>
                      </label>
                      <label className="flex items-start gap-3 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={work.order.marketing}
                          onChange={(event) => setOrder({ marketing: event.target.checked })}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[#16130f]"
                        />
                        <span>
                          Chcę dostawać informacje o ofercie e-mailem lub SMS-em. To zgoda dobrowolna i nie jest warunkiem
                          zgłoszenia.
                        </span>
                      </label>
                    </div>
                    <p className="text-sm font-medium text-muted">
                      Dane przetwarzamy według{" "}
                      <a className="text-poster underline" href="/prawne/prywatnosc">
                        polityki prywatności
                      </a>
                      .
                    </p>
                    {orderError ? <p className="text-sm font-semibold text-coral">{orderError}</p> : null}
                    <button type="submit" disabled={orderBusy} className={`${inkButton} px-4 py-4 text-base`}>
                      Zapisz zgłoszenie
                    </button>
                    <p className="text-sm text-muted">
                      Płatności nie pobieramy. To jeszcze nie jest zamówienie z obowiązkiem zapłaty.
                    </p>
                  </form>
                ) : (
                  <div className="grid gap-3 rounded-[24px] border border-line bg-white p-5 md:p-6">
                    <h2 className="font-display text-xl font-extrabold tracking-tight">Zapisz zgłoszenie</h2>
                    <p className="text-sm text-muted">
                      Zgłoszenie i ponowne otwarcie projektu są dostępne po zalogowaniu. Płatności nie pobieramy.
                    </p>
                    <button type="button" className={`${inkButton} px-4 py-4`} onClick={() => setLoginOpen(true)}>
                      Zaloguj się i zapisz zgłoszenie
                    </button>
                  </div>
                )}

                <details className="group rounded-[20px] border border-dashed border-line bg-white/60 p-4 text-sm text-muted">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-poster [&::-webkit-details-marker]:hidden">
                    Pola przyszłego zamówienia
                    <span className="text-muted transition-transform group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="mt-2">Trzymane na serwerze {seller.brand}. Do CRM nie wychodzą.</p>
                  <ul className="mt-3 grid gap-1">
                    <li>rzecz: {product.name}</li>
                    <li>{work.product === "tshirt" ? `rozmiar: ${work.size}` : "pojemność: 330 ml"}</li>
                    <li>kolor rzeczy: {colorName}</li>
                    <li>nakład: {work.qty}</li>
                    <li>wykończenie: {finishName} — tylko rodzaj, bez szerokości rolki</li>
                    <li>editorKind: souvenir_3d</li>
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
                </details>
              </div>

              <aside className="on-poster grid gap-4 rounded-[24px] bg-poster p-6 text-cream lg:sticky lg:top-24">
                <p className="text-[12px] font-bold tracking-[0.16em] text-cream/60 uppercase">Razem</p>
                <PriceChip size="lg" />
                <ul className="grid gap-1.5 text-sm text-cream/80">
                  <li>
                    {product.name} · {work.qty} szt.
                  </li>
                  <li>Cena wyjściowa brutto</li>
                  <li>Koszt dostawy — przed płatnością</li>
                </ul>
                <hr className="border-cream/15" />
                <p className="text-sm leading-relaxed text-cream/70">
                  Płatności nie pobieramy. „Zapisz zgłoszenie” zapisuje projekt i dane na serwerze {seller.brand}.
                </p>
                {user && designId ? (
                  <p className="text-sm text-cream/70">
                    Własny projekt:{" "}
                    <a className="font-semibold text-cream underline" href={`/m/${designId}`}>
                      /m/{designId}
                    </a>
                  </p>
                ) : null}
                {saveError ? <p className="text-sm font-semibold text-sun">Nie zapisano</p> : null}
              </aside>
            </div>
          </div>
          <SiteFooter />
        </section>
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
      <button
        type="button"
        className="rounded-full border border-poster/15 bg-white px-3.5 py-2 text-sm font-semibold whitespace-nowrap text-poster hover:border-poster sm:px-4"
        onClick={onLogin}
      >
        Zaloguj<span className="hidden sm:inline"> się</span>
      </button>
    );
  }
  return (
    <details className="relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-poster/15 bg-white py-1.5 pr-3 pl-1.5 text-sm font-semibold text-poster hover:border-poster [&::-webkit-details-marker]:hidden"
        aria-label={`Konto: ${user.name}`}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-sun font-display text-xs font-extrabold" aria-hidden="true">
          {user.name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <span className="hidden max-w-[9rem] truncate sm:inline">{user.name}</span>
      </summary>
      <div className="absolute right-0 z-40 mt-2 grid w-52 gap-1 rounded-2xl border border-line bg-white p-2 text-sm text-poster shadow-[0_18px_40px_-16px_rgba(22,19,15,0.45)]">
        <p className="truncate px-3 pt-1 pb-2 text-xs text-muted">{user.phone}</p>
        <button type="button" className="rounded-xl px-3 py-2 text-left font-semibold hover:bg-cream" onClick={onLogout}>
          Wyloguj
        </button>
        <button type="button" className="rounded-xl px-3 py-2 text-left font-semibold text-coral hover:bg-cream" onClick={onDelete}>
          Usuń konto
        </button>
      </div>
    </details>
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
  product,
  onProduct,
  current,
}: {
  onHome: () => void;
  onCart: () => void;
  account: ReactNode;
  product?: ProductId;
  onProduct?: (id: ProductId) => void;
  current?: "cart";
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-cream/90 text-poster backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-3 md:px-7">
        <button type="button" onClick={onHome} className="text-[17px] sm:text-lg md:text-xl" aria-label={`${seller.brand} — start`}>
          <BrandMark />
        </button>
        {onProduct ? (
          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Rzeczy">
            {catalog.map((item) => {
              const selected = current !== "cart" && product === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={selected ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    selected ? "bg-poster text-cream" : "text-poster/70 hover:text-poster"
                  }`}
                  onClick={() => onProduct(item.id)}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>
        ) : null}
        <div className="flex-1" />
        {account}
        <button
          type="button"
          aria-current={current === "cart" ? "page" : undefined}
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold whitespace-nowrap ${
            current === "cart" ? "border-poster bg-poster text-cream" : "border-poster/15 bg-white hover:border-poster"
          }`}
          onClick={onCart}
        >
          <BagIcon />
          Koszyk
        </button>
      </div>
    </header>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="mt-5 mb-2.5 text-[12px] font-bold tracking-[0.14em] text-muted uppercase">{children}</p>
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
            className={`min-w-12 rounded-full border px-4 py-2 font-semibold transition-colors ${
              selected ? "border-poster bg-poster text-cream" : "border-poster/15 bg-white hover:border-poster"
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

function ShopFact({ title, line }: { title: string; line: string }) {
  return (
    <li className="grid gap-0.5">
      <span className="font-bold">{title}</span>
      <span className="text-muted">{line}</span>
    </li>
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
  const dark = tone === "dark";
  return (
    <button
      type="button"
      onClick={onPick}
      className={`door relative flex min-h-[50dvh] flex-1 flex-col overflow-hidden px-6 pb-7 text-left md:min-h-dvh md:px-12 md:pt-24 md:pb-12 ${
        dark ? "on-poster halftone bg-poster pt-16 text-cream" : "halftone-ink bg-cream pt-6 text-poster"
      } ${gone ? "door-leave" : ""} ${taken ? "door-take" : ""}`}
    >
      <span className="flex flex-1 items-center justify-center py-2 md:py-6">{children}</span>
      <span className="relative z-10 grid gap-2 md:gap-3">
        <span className={`text-[12px] font-bold tracking-[0.16em] uppercase ${dark ? "text-cream/60" : "text-poster/55"}`}>
          {line}
        </span>
        <span className="font-display text-[42px] leading-[0.92] font-extrabold tracking-[-0.03em] md:text-[clamp(56px,6.4vw,100px)]">
          {title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-3">
          <PriceChip />
          <span className={`door-cta ${coralButton} px-5 py-3 text-base`}>
            Zrób własny
            <ArrowIcon />
          </span>
        </span>
        <span className={`text-sm ${dark ? "text-cream/55" : "text-poster/55"}`}>
          {seller.city} · gotowe w {seller.leadTime}
        </span>
      </span>
    </button>
  );
}
