"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { EditorHandle } from "@/components/editor-canvas";
import { EditorLoader } from "@/components/editor-loader";
import { LoginPanel } from "@/components/login-panel";
import { ProductArt } from "@/components/product-art";
import { SiteFooter } from "@/components/site-footer";
import { PosterHeader } from "@/components/poster-chrome";
import { VariantDoors, VariantShop } from "@/components/variants";
import { defaultAccent, type AccentId } from "@/components/variants/accents";
import type { Variant } from "@/components/variants/kit";
import { CartWzorLine, WzorOrderFields } from "@/components/wzory/cart-wzor";
import { ChosenWzor } from "@/components/wzory/chosen-wzor";
import { WzoryStrip } from "@/components/wzory/wzory-strip";
import { dropForeignDesign, withoutDesign } from "@/lib/wzory/choose";
import { useWzorFonts } from "@/lib/wzory/fonts-client";
import {
  emptyOrder,
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
import { finishes, productById, productPaths, shirtColors, type ProductId } from "@/lib/catalog";
import { DEFAULT_MUG_MODEL_URL, DEFAULT_TSHIRT_MODEL_URL } from "@/components/souvenir3d/types";
import { seller } from "@/lib/seller";

const PreviewBars =
  process.env.NODE_ENV === "production"
    ? function PreviewBarsOff() {
        return null;
      }
    : dynamic(() => import("@/components/variants/preview-bars").then((mod) => mod.PreviewBars), { ssr: false });

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

export function MerchFlow({
  initial,
  variant = "a",
  compare = false,
  accent = defaultAccent,
  accentPanel = false,
}: {
  initial: SessionView;
  variant?: Variant;
  compare?: boolean;
  accent?: AccentId;
  accentPanel?: boolean;
}) {
  const [user, setUser] = useState<PublicUser | null>(initial.user);
  const [designId, setDesignId] = useState<string | null>(initial.designId);
  const [work, setWork] = useState<WorkSnapshot>(initial.work);
  const [orderName, setOrderName] = useState(initial.user?.name ?? "");
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
  const workRef = useRef(work);
  workRef.current = work;
  /** Экран с сервера не выезжает: с opacity 0 на первом кадре Chrome не засчитывает отрисовку (FCP, LCP). */
  const [stepMoved, setStepMoved] = useState(false);
  const rise = stepMoved ? "rise" : "";
  const fontsReady = useWzorFonts(work.design?.fonts);
  const editorOpen = work.step === "editor" && fontsReady && readyFor === editorKey && !editorFailed;

  function updateWork(patch: (current: WorkSnapshot) => WorkSnapshot) {
    const next = patch(workRef.current);
    if (next === workRef.current) return;
    if (next.step !== workRef.current.step) setStepMoved(true);
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
    const path = work.step === "shop" ? productPaths[work.product] : "/";
    if (window.location.pathname !== path) window.history.replaceState(window.history.state, "", path);
  }, [work.step, work.product]);

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
  }, [work]);

  useEffect(() => {
    const flush = () => {
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

  function switchProduct(id: ProductId) {
    updateWork((current) =>
      dropForeignDesign({
        ...current,
        product: id,
        zone: productById(id).zones[0].id,
        step: "shop",
      }),
    );
  }

  function startOwn() {
    if (workRef.current.design && !window.confirm("Zacząć od pustego arkusza? Wybrany wzór zniknie z projektu.")) return;
    updateWork((current) => ({ ...withoutDesign(current), step: "editor" }));
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
      {process.env.NODE_ENV !== "production" && (work.step === "doors" || work.step === "shop") ? (
        <PreviewBars
          variant={variant}
          accent={accent}
          compare={compare}
          accentPanel={accentPanel}
          shop={work.step === "shop"}
        />
      ) : null}

      {work.step === "doors" ? (
        <VariantDoors
          variant={variant}
          accent={accent}
          leaving={leaving}
          onPick={openProduct}
          onCart={() => updateWork((current) => ({ ...current, cartFrom: "shop", step: "cart" }))}
          account={account}
        />
      ) : null}

      {work.step === "shop" ? (
        <VariantShop
          variant={variant}
          accent={accent}
          work={work}
          onChange={(patch) => updateWork((current) => ({ ...current, ...patch }))}
          onProduct={switchProduct}
          onHome={() => updateWork((current) => ({ ...current, step: "doors" }))}
          onCart={() => updateWork((current) => ({ ...current, cartFrom: "shop", step: "cart" }))}
          onEditor={startOwn}
          account={account}
          chosen={
            work.design ? (
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
            ) : null
          }
          showcase={<WzoryStrip product={work.product} color={work.color} />}
        />
      ) : null}

      {work.step === "editor" ? (
        <section className="relative flex h-dvh flex-col bg-[#F3EEE4] text-ink">
          <header className="flex h-14 shrink-0 items-center gap-3 bg-[#16130F] px-4 text-[#F3EEE4]">
            <button
              type="button"
              className="text-sm text-[#F3EEE4]/70 hover:text-[#F3EEE4]"
              onClick={() => updateWork((current) => ({ ...current, step: "shop" }))}
            >
              Do rzeczy
            </button>
            <span className="font-poster text-sm font-extrabold">{product.name}</span>
            <span className="hidden text-sm text-[#F3EEE4]/55 sm:inline">
              {work.product === "tshirt" ? `${work.size} · ` : "330 ml · "}
              {colorName} · {work.qty} szt. · {finishName}
            </span>
            <div className="flex-1" />
            <Link href="/prawne/regulamin" className="text-sm text-[#F3EEE4]/70 hover:text-[#F3EEE4]">
              Prawne
            </Link>
            {saveError ? <span className="text-sm text-[#F3EEE4]/70">Nie zapisano</span> : null}
            {work.quality.length > 0 ? <span className="text-sm text-(--a-badge)">Uwagi do druku</span> : null}
            <span className="rounded-full bg-(--a-badge) px-3 py-1 text-sm font-bold text-(--a-badge-text)">
              {seller.priceFrom}
            </span>
            <button
              type="button"
              className="btn-kobalt btn-kobalt-sm"
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
        <PosterHeader account={account} current={work.product === "mug" ? "mug" : "tshirt"} />
        <section className={`${rise} mx-auto max-w-3xl px-5 py-8 md:px-7`}>
          <button
            type="button"
            className="text-sm font-bold text-(--a-mark) hover:underline"
            onClick={() => updateWork((current) => ({ ...current, step: current.cartFrom }))}
          >
            {work.cartFrom === "shop" ? "← Do rzeczy" : "← Do edytora"}
          </button>
          <h1 className="font-poster mt-4 text-[40px] leading-[0.95] font-black tracking-tight md:text-[52px]">Koszyk</h1>
          <article className="mt-6 flex items-center gap-4 rounded-2xl border border-[#16130F]/10 bg-white p-4">
            {work.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={work.previewUrl}
                alt={`Podgląd projektu: ${product.name}`}
                className="h-24 w-24 object-contain"
                style={{ background: work.color }}
              />
            ) : (
              <ProductArt product={work.product} color={work.color} text="" size={96} hidePrint />
            )}
            <div>
              <h2 className="font-poster text-xl font-extrabold">{product.name}</h2>
              <p className="text-muted">
                {[work.product === "tshirt" ? work.size : "330 ml", colorName, `nakład ${work.qty}`, zone.label, finishName]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-1 inline-flex rounded-full bg-(--a-badge) px-3 py-1 text-sm font-bold text-(--a-badge-text)">
                {seller.priceFrom}
              </p>
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
              <p className="rounded-2xl bg-[#16130F] px-4 py-4 text-[#F3EEE4]">
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
                  className="mt-1 accent-(--a-mark)"
                />
                <span>
                  Akceptuję <Link href="/prawne/regulamin" className="underline">regulamin</Link>.
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
                  <Link href="/prawne/odstapienie" className="underline">
                    Odstąpienie
                  </Link>
                </span>
              </label>
              <p className="text-sm font-medium text-muted">
                Dane przetwarzamy według{" "}
                <Link className="text-ink underline" href="/prawne/prywatnosc">
                  polityki prywatności
                </Link>
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
                className="btn-kobalt w-full py-4"
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
                className="btn-kobalt w-full py-4"
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
      <button type="button" className="rounded-full bg-[#F3EEE4] px-4 py-2 text-sm font-semibold text-[#16130F]" onClick={onLogin}>
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
