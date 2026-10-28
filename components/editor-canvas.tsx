"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, IText, FabricImage } from "fabric";
import { Souvenir3dPreview } from "@/components/souvenir3d/Souvenir3dPreview";
import {
  DEFAULT_PRINT_AREA_MUG,
  DEFAULT_PRINT_AREAS_TSHIRT,
  type PrintAreaConfig,
} from "@/components/souvenir3d/types";
import { printAreaFabricPx } from "@/components/souvenir3d/scale";
import type { ProductId } from "@/lib/catalog";
import { defaultPrintText } from "@/lib/work";
import {
  BackwardIcon,
  CenterIcon,
  DuplicateIcon,
  ForwardIcon,
  LargerIcon,
  PhotoIcon,
  RedoIcon,
  RotateIcon,
  SmallerIcon,
  TextIcon,
  TrashIcon,
  UndoIcon,
} from "@/components/editor-icons";

/** Как forcedPageSize у souvenir_3d: координаты зоны в масштабе 1. */
const SCENE_SCALE = 1;

const textInks = [
  { id: "czarny", label: "Czarny", value: "#1a1916" },
  { id: "bordowy", label: "Bordowy", value: "#7d1d1d" },
  { id: "granatowy", label: "Granatowy", value: "#1e3a5f" },
] as const;

type HistoryBucket = { past: string[]; future: string[] };

function isTextObject(object: { type?: string }) {
  return object.type === "i-text" || object.type === "text" || object.type === "textbox";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function areasFor(product: ProductId): PrintAreaConfig[] {
  return product === "mug" ? [DEFAULT_PRINT_AREA_MUG] : DEFAULT_PRINT_AREAS_TSHIRT;
}

/** Как в Souvenir3dEditor: почти белый фон зоны не печатается на модели. */
function knockoutWhite(source: HTMLCanvasElement): string | null {
  const w = source.width;
  const h = source.height;
  if (w < 2 || h < 2) return null;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    if (r >= 248 && g >= 248 && b >= 248) data[i + 3] = 0;
  }
  ctx.putImageData(image, 0, 0);
  return out.toDataURL("image/png");
}

export function EditorCanvas({
  product,
  activeId,
  bodyColor,
  initialPages,
  onActiveId,
  onPreview,
  onPages,
}: {
  product: ProductId;
  activeId: string;
  bodyColor: string;
  initialPages: Record<string, object>;
  onActiveId: (id: string) => void;
  onPreview: (url: string | null) => void;
  onPages: (pages: Record<string, object>) => void;
}) {
  const areas = areasFor(product);
  const active = areas.find((area) => area.id === activeId) ?? areas[0];
  const { widthPx, heightPx } = printAreaFabricPx(active.widthMm, active.heightMm, SCENE_SCALE);
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const onPreviewRef = useRef(onPreview);
  onPreviewRef.current = onPreview;
  const onPagesRef = useRef(onPages);
  onPagesRef.current = onPages;
  const pages = useRef<Record<string, object>>(initialPages);
  const emitted = useRef("");
  const areaIdRef = useRef(active.id);
  const histories = useRef<Record<string, HistoryBucket>>({});
  const applying = useRef(false);
  const skipRemember = useRef(false);
  const publishRef = useRef<() => void>(() => {});
  areaIdRef.current = active.id;
  const [textures, setTextures] = useState<Record<string, string>>({});
  const [revision, setRevision] = useState(0);
  const [fit, setFit] = useState(0.45);
  const [sheetEmpty, setSheetEmpty] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
  const [textSelected, setTextSelected] = useState(false);
  const [textFill, setTextFill] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"model" | "sheet">("model");

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const pad = 52;
      const width = Math.max(stage.clientWidth - pad, 160);
      const height = Math.max(stage.clientHeight - pad, 160);
      setFit(Math.min(width / widthPx, height / heightPx, 1));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [widthPx, heightPx]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const el = document.createElement("canvas");
    host.replaceChildren(el);
    const canvas = new Canvas(el, {
      width: widthPx,
      height: heightPx,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;
    let stopped = false;
    setCanDelete(false);
    setTextSelected(false);
    setTextFill(null);

    const bucket = () => {
      const current = histories.current[active.id] ?? { past: [], future: [] };
      histories.current[active.id] = current;
      return current;
    };
    const syncHistoryFlags = () => {
      const current = bucket();
      setCanUndo(current.past.length > 1);
      setCanRedo(current.future.length > 0);
    };

    let timer = 0;
    let readyToEmit = false;
    const remember = () => {
      if (!readyToEmit || applying.current || skipRemember.current || stopped) return;
      const shot = JSON.stringify(canvas.toObject());
      const current = bucket();
      if (current.past[current.past.length - 1] === shot) return;
      current.past.push(shot);
      if (current.past.length > 12) current.past.shift();
      current.future = [];
      syncHistoryFlags();
    };
    const emitPages = () => {
      if (!readyToEmit || stopped) return;
      pages.current[active.id] = canvas.toObject();
      const encoded = JSON.stringify(pages.current);
      if (encoded === emitted.current) return;
      emitted.current = encoded;
      onPagesRef.current({ ...pages.current });
    };
    const publish = () => {
      if (applying.current) return;
      remember();
      emitPages();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (stopped) return;
        const lower = canvas.getElement();
        const url = knockoutWhite(lower);
        if (!url) return;
        const empty = canvas.getObjects().length === 0;
        setTextures((prev) => ({ ...prev, [active.id]: url }));
        setRevision((n) => n + 1);
        setSheetEmpty(empty);
        if (active.id === areasFor(product)[0]?.id) onPreviewRef.current(empty ? null : url);
      }, 180);
    };

    const saved = pages.current[active.id];
    const ready = saved
      ? canvas.loadFromJSON(saved).then(() => {
          if (!stopped) canvas.requestRenderAll();
        })
      : Promise.resolve();
    ready.then(() => {
      if (stopped) return;
      readyToEmit = true;
      const shot = JSON.stringify(canvas.toObject());
      const current = bucket();
      if (current.past.length === 0) current.past.push(shot);
      syncHistoryFlags();
      publish();
    });

    const onChange = () => publish();
    const onSelect = () => {
      const objects = canvas.getActiveObjects();
      const text = objects.find((object) => isTextObject(object));
      setCanDelete(objects.length > 0);
      setTextSelected(Boolean(text));
      setTextFill(text && typeof text.fill === "string" ? text.fill : null);
    };
    canvas.on("object:modified", onChange);
    canvas.on("object:added", onChange);
    canvas.on("object:removed", onChange);
    canvas.on("text:changed", onChange);
    canvas.on("selection:created", onSelect);
    canvas.on("selection:updated", onSelect);
    canvas.on("selection:cleared", onSelect);
    publishRef.current = () => {
      if (!stopped) publish();
    };

    return () => {
      if (readyToEmit) {
        pages.current[active.id] = canvas.toObject();
        const encoded = JSON.stringify(pages.current);
        if (encoded !== emitted.current) {
          emitted.current = encoded;
          onPagesRef.current({ ...pages.current });
        }
      }
      stopped = true;
      publishRef.current = () => {};
      window.clearTimeout(timer);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [active.id, active.heightMm, active.widthMm, heightPx, product, widthPx]);

  function addText() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new IText(defaultPrintText, {
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      originX: "center",
      originY: "center",
      fontFamily: "Manrope, sans-serif",
      fontSize: Math.round(canvas.getWidth() / 8),
      fill: "#1a1916",
      fontWeight: "800",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
  }

  async function addPhoto(file: File) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const url = await fileToDataUrl(file);
    const image = await FabricImage.fromURL(url);
    const max = canvas.getWidth() * 0.7;
    const scale = max / Math.max(image.width || max, 1);
    image.set({
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      originX: "center",
      originY: "center",
      scaleX: scale,
      scaleY: scale,
    });
    canvas.add(image);
    canvas.setActiveObject(image);
    canvas.requestRenderAll();
  }

  function removeSelected() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const selected = canvas.getActiveObjects();
    if (selected.length === 0) return;
    canvas.remove(...selected);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setCanDelete(false);
    setTextSelected(false);
    setTextFill(null);
  }

  function touch() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.requestRenderAll();
    publishRef.current();
  }

  function centerSelected() {
    const canvas = fabricRef.current;
    const activeObject = canvas?.getActiveObject();
    if (!canvas || !activeObject) return;
    canvas.centerObject(activeObject);
    activeObject.setCoords();
    touch();
  }

  function rotateSelected() {
    const canvas = fabricRef.current;
    const activeObject = canvas?.getActiveObject();
    if (!canvas || !activeObject) return;
    activeObject.rotate(((activeObject.angle || 0) + 15) % 360);
    activeObject.setCoords();
    touch();
  }

  function resizeSelected(factor: number) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getActiveObjects();
    if (objects.length === 0) return;
    for (const object of objects) {
      if (isTextObject(object)) {
        const current = object.get("fontSize");
        const size = Math.round((typeof current === "number" ? current : 32) * factor);
        object.set("fontSize", Math.min(240, Math.max(12, size)));
      } else {
        object.scaleX = Math.min(8, Math.max(0.05, (object.scaleX || 1) * factor));
        object.scaleY = Math.min(8, Math.max(0.05, (object.scaleY || 1) * factor));
      }
      object.setCoords();
    }
    touch();
  }

  async function duplicateSelected() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getActiveObjects();
    if (objects.length === 0) return;
    const clones = await Promise.all(objects.map((object) => object.clone()));
    canvas.discardActiveObject();
    for (const clone of clones) {
      clone.set({ left: (clone.left || 0) + 24, top: (clone.top || 0) + 24 });
      canvas.add(clone);
    }
    if (clones.length === 1) canvas.setActiveObject(clones[0]);
    canvas.requestRenderAll();
  }

  function liftSelected(forward: boolean) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getActiveObjects();
    if (objects.length === 0) return;
    for (const object of objects) {
      if (forward) canvas.bringObjectForward(object);
      else canvas.sendObjectBackwards(object);
    }
    touch();
  }

  function paintText(fill: string) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const texts = canvas.getActiveObjects().filter((object) => isTextObject(object));
    if (texts.length === 0) return;
    for (const object of texts) object.set("fill", fill);
    setTextFill(fill);
    touch();
  }

  async function stepHistory(forward: boolean) {
    const canvas = fabricRef.current;
    const bucket = histories.current[areaIdRef.current];
    if (!canvas || !bucket) return;
    if (forward ? bucket.future.length === 0 : bucket.past.length < 2) return;
    const next = forward ? bucket.future.pop() : bucket.past.pop();
    if (!next) return;
    if (forward) bucket.past.push(next);
    else bucket.future.push(next);
    const shot = forward ? next : bucket.past[bucket.past.length - 1];
    if (!shot) return;
    applying.current = true;
    try {
      await canvas.loadFromJSON(JSON.parse(shot));
      canvas.discardActiveObject();
    } finally {
      applying.current = false;
    }
    setCanDelete(false);
    setTextSelected(false);
    setTextFill(null);
    setCanUndo(bucket.past.length > 1);
    setCanRedo(bucket.future.length > 0);
    canvas.requestRenderAll();
    skipRemember.current = true;
    publishRef.current();
    skipRemember.current = false;
  }

  useEffect(() => {
    if (mobilePanel !== "sheet") return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const frame = window.requestAnimationFrame(() => {
      canvas.calcOffset();
      canvas.requestRenderAll();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobilePanel]);

  const sheetW = Math.round(widthPx * fit);
  const sheetH = Math.round(heightPx * fit);
  const sheetHidden = mobilePanel !== "sheet";
  const modelHidden = mobilePanel !== "model";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-5 border-b border-line px-4 py-2 text-sm lg:hidden">
        <button
          type="button"
          className={`border-b-2 pb-0.5 ${mobilePanel === "model" ? "border-ink font-semibold text-ink" : "border-transparent text-muted"}`}
          onClick={() => setMobilePanel("model")}
        >
          Rzecz
        </button>
        <button
          type="button"
          className={`border-b-2 pb-0.5 ${mobilePanel === "sheet" ? "border-ink font-semibold text-ink" : "border-transparent text-muted"}`}
          onClick={() => setMobilePanel("sheet")}
        >
          Arkusz
        </button>
        {areas.length > 1 && mobilePanel === "model" ? (
          <div className="ml-auto flex gap-3">
            {areas.map((area) => (
              <button
                key={area.id}
                type="button"
                className={area.id === active.id ? "font-semibold text-ink" : "text-muted"}
                onClick={() => onActiveId(area.id)}
              >
                {area.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid min-h-0 min-w-0 flex-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <aside className={`${sheetHidden ? "hidden" : "flex"} min-h-0 min-w-0 flex-col overflow-hidden lg:flex lg:border-r lg:border-line`}>
        <div className="shrink-0 border-b border-line bg-card px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <ToolButton label="Tekst" tone="primary" onClick={addText}>
              <TextIcon />
            </ToolButton>
            <label
              title="Zdjęcie"
              aria-label="Zdjęcie"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl bg-ink text-white hover:bg-[#2c2a26]"
            >
              <PhotoIcon />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void addPhoto(file);
                  event.target.value = "";
                }}
              />
            </label>
            <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
            <ToolButton label="Cofnij" disabled={!canUndo} onClick={() => void stepHistory(false)}>
              <UndoIcon />
            </ToolButton>
            <ToolButton label="Ponów" disabled={!canRedo} onClick={() => void stepHistory(true)}>
              <RedoIcon />
            </ToolButton>
            <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
            <ToolButton label="Środek" disabled={!canDelete} onClick={centerSelected}>
              <CenterIcon />
            </ToolButton>
            <ToolButton label="Obróć" disabled={!canDelete} onClick={rotateSelected}>
              <RotateIcon />
            </ToolButton>
            <ToolButton label="Duplikuj" disabled={!canDelete} onClick={() => void duplicateSelected()}>
              <DuplicateIcon />
            </ToolButton>
            <ToolButton label="Większy" disabled={!canDelete} onClick={() => resizeSelected(1.15)}>
              <LargerIcon />
            </ToolButton>
            <ToolButton label="Mniejszy" disabled={!canDelete} onClick={() => resizeSelected(1 / 1.15)}>
              <SmallerIcon />
            </ToolButton>
            <ToolButton label="Wyżej" disabled={!canDelete} onClick={() => liftSelected(true)}>
              <ForwardIcon />
            </ToolButton>
            <ToolButton label="Niżej" disabled={!canDelete} onClick={() => liftSelected(false)}>
              <BackwardIcon />
            </ToolButton>
            <ToolButton label="Usuń" disabled={!canDelete} onClick={removeSelected}>
              <TrashIcon />
            </ToolButton>
            <div className="ml-auto flex flex-wrap gap-2">
              {areas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  aria-pressed={area.id === active.id}
                  className={`rounded-full px-3.5 py-2 text-sm font-semibold ${
                    area.id === active.id ? "bg-ink text-white" : "border border-line bg-paper text-ink hover:border-ink"
                  }`}
                  onClick={() => onActiveId(area.id)}
                >
                  {area.label}
                </button>
              ))}
            </div>
          </div>
          {textSelected ? (
            <div className="mt-2 flex items-center gap-2">
              {textInks.map((ink) => {
                const selected = textFill?.toLowerCase() === ink.value;
                return (
                  <button
                    key={ink.id}
                    type="button"
                    aria-label={ink.label}
                    title={ink.label}
                    aria-pressed={selected}
                    className={`h-9 w-9 rounded-full border ${selected ? "border-ink ring-2 ring-ink ring-offset-2 ring-offset-card" : "border-line"}`}
                    style={{ background: ink.value }}
                    onClick={() => paintText(ink.value)}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
        <div ref={stageRef} className="grid min-h-0 flex-1 place-items-center overflow-hidden px-3 pb-3">
          <div className="grid justify-items-center gap-1">
            <span className="text-[11px] tracking-wide text-muted">{active.widthMm} mm</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] tracking-wide text-muted [writing-mode:vertical-rl] rotate-180">
                {active.heightMm} mm
              </span>
              <div className="relative overflow-hidden" style={{ width: sheetW, height: sheetH }}>
                <div
                  ref={hostRef}
                  className="absolute top-0 left-0 origin-top-left bg-white shadow-[0_0_0_1px_rgba(26,25,22,0.14)]"
                  style={{ width: widthPx, height: heightPx, transform: `scale(${fit})` }}
                />
                {sheetEmpty ? (
                  <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted">
                    Tekst albo zdjęcie
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </aside>
      <div className={`${modelHidden ? "hidden" : "block"} h-full min-h-0 min-w-0 lg:block`}>
        <Souvenir3dPreview
          printAreas={areas}
          activePrintAreaId={active.id}
          texturesByArea={textures}
          textureRevision={revision}
          bodyColor={bodyColor}
          caption=""
        />
      </div>
      </div>
    </div>
  );
}

export function editorAreas(product: ProductId) {
  return areasFor(product);
}

function ToolButton({
  label,
  children,
  onClick,
  disabled,
  tone = "plain",
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "plain";
}) {
  const look =
    tone === "primary"
      ? "bg-ink text-white hover:bg-[#2c2a26]"
      : "border border-line bg-paper text-ink hover:border-ink";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center rounded-xl disabled:cursor-default disabled:opacity-35 disabled:hover:border-line disabled:hover:bg-paper ${look}`}
    >
      {children}
    </button>
  );
}

