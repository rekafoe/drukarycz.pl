"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, IText, FabricImage } from "fabric";
import { Souvenir3dPreview } from "@/components/souvenir3d/Souvenir3dPreview";
import {
  DEFAULT_PRINT_AREA_MUG,
  DEFAULT_PRINT_AREAS_TSHIRT,
  type PrintAreaConfig,
} from "@/components/souvenir3d/types";
import { printAreaFabricPx } from "@/components/souvenir3d/scale";
import type { ProductId } from "@/lib/catalog";

/** Как forcedPageSize у souvenir_3d: координаты зоны в масштабе 1. */
const SCENE_SCALE = 1;

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
  const [textures, setTextures] = useState<Record<string, string>>({});
  const [revision, setRevision] = useState(0);
  const [fit, setFit] = useState(0.45);
  const [sheetEmpty, setSheetEmpty] = useState(true);
  const [canDelete, setCanDelete] = useState(false);
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

    let timer = 0;
    let readyToEmit = false;
    const emitPages = () => {
      if (!readyToEmit || stopped) return;
      pages.current[active.id] = canvas.toObject();
      const encoded = JSON.stringify(pages.current);
      if (encoded === emitted.current) return;
      emitted.current = encoded;
      onPagesRef.current({ ...pages.current });
    };
    const publish = () => {
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
      publish();
    });

    const onChange = () => publish();
    const onSelect = () => setCanDelete(canvas.getActiveObjects().length > 0);
    canvas.on("object:modified", onChange);
    canvas.on("object:added", onChange);
    canvas.on("object:removed", onChange);
    canvas.on("text:changed", onChange);
    canvas.on("selection:created", onSelect);
    canvas.on("selection:updated", onSelect);
    canvas.on("selection:cleared", onSelect);

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
      window.clearTimeout(timer);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [active.id, active.heightMm, active.widthMm, heightPx, product, widthPx]);

  function addText() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new IText("Ваш принт", {
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
          Вещь
        </button>
        <button
          type="button"
          className={`border-b-2 pb-0.5 ${mobilePanel === "sheet" ? "border-ink font-semibold text-ink" : "border-transparent text-muted"}`}
          onClick={() => setMobilePanel("sheet")}
        >
          Лист
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
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm text-muted">
          <button type="button" className="hover:text-ink" onClick={addText}>
            Текст
          </button>
          <label className="cursor-pointer hover:text-ink">
            Фото
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
          <button
            type="button"
            className={canDelete ? "hover:text-ink" : "cursor-default opacity-35"}
            disabled={!canDelete}
            onClick={removeSelected}
          >
            Удалить
          </button>
          {areas.length > 1 ? (
            <div className="ml-auto flex gap-3">
              {areas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  className={area.id === active.id ? "font-semibold text-ink" : "hover:text-ink"}
                  onClick={() => onActiveId(area.id)}
                >
                  {area.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="ml-auto">{active.label}</span>
          )}
        </div>
        <div ref={stageRef} className="grid min-h-0 flex-1 place-items-center overflow-hidden px-3 pb-3">
          <div className="grid justify-items-center gap-1">
            <span className="text-[11px] tracking-wide text-muted">{active.widthMm} мм</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] tracking-wide text-muted [writing-mode:vertical-rl] rotate-180">
                {active.heightMm} мм
              </span>
              <div className="relative overflow-hidden" style={{ width: sheetW, height: sheetH }}>
                <div
                  ref={hostRef}
                  className="absolute top-0 left-0 origin-top-left bg-white shadow-[0_0_0_1px_rgba(26,25,22,0.14)]"
                  style={{ width: widthPx, height: heightPx, transform: `scale(${fit})` }}
                />
                {sheetEmpty ? (
                  <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted">
                    Текст или фото
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

