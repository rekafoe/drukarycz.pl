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
  onActiveId,
  onPreview,
}: {
  product: ProductId;
  activeId: string;
  onActiveId: (id: string) => void;
  onPreview: (url: string | null) => void;
}) {
  const areas = areasFor(product);
  const active = areas.find((area) => area.id === activeId) ?? areas[0];
  const { widthPx, heightPx } = printAreaFabricPx(active.widthMm, active.heightMm, SCENE_SCALE);
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const onPreviewRef = useRef(onPreview);
  onPreviewRef.current = onPreview;
  const pages = useRef<Record<string, object>>({});
  const [textures, setTextures] = useState<Record<string, string>>({});
  const [revision, setRevision] = useState(0);
  const [fit, setFit] = useState(0.45);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const pad = 28;
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

    let timer = 0;
    const publish = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (stopped) return;
        const lower = canvas.getElement();
        const url = knockoutWhite(lower);
        if (!url) return;
        setTextures((prev) => ({ ...prev, [active.id]: url }));
        setRevision((n) => n + 1);
        if (active.id === areasFor(product)[0]?.id) onPreviewRef.current(url);
      }, 180);
    };

    const saved = pages.current[active.id];
    const ready = saved
      ? canvas.loadFromJSON(saved).then(() => {
          if (!stopped) canvas.requestRenderAll();
        })
      : Promise.resolve();
    ready.then(() => {
      if (!stopped) publish();
    });

    const onChange = () => publish();
    canvas.on("object:modified", onChange);
    canvas.on("object:added", onChange);
    canvas.on("object:removed", onChange);
    canvas.on("text:changed", onChange);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      pages.current[active.id] = canvas.toObject();
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
  }

  return (
    <div className="grid min-h-0 flex-1 md:grid-cols-[220px_1fr_340px]">
      <aside className="border-r border-line bg-card p-4">
        <p className="mb-2 text-[12px] font-bold tracking-[0.06em] text-muted uppercase">Зона</p>
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              className={`rounded-full border px-3 py-1.5 text-sm font-bold ${
                area.id === active.id ? "border-ink bg-ink text-white" : "border-line"
              }`}
              onClick={() => onActiveId(area.id)}
            >
              {area.label}
            </button>
          ))}
        </div>
        <p className="mt-4 mb-2 text-[12px] font-bold tracking-[0.06em] text-muted uppercase">На лист</p>
        <div className="grid gap-2">
          <button type="button" className="rounded-xl border border-line px-3 py-2 font-bold" onClick={addText}>
            Текст
          </button>
          <button type="button" className="rounded-xl border border-line px-3 py-2 font-bold" onClick={removeSelected}>
            Удалить
          </button>
          <label className="cursor-pointer rounded-xl border border-line px-3 py-2 text-center font-bold">
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
        </div>
        <p className="mt-4 text-xs text-muted">
          Холст Fabric, {active.widthMm}×{active.heightMm} мм, зона «{active.label}». В печать уходит плоский лист. Модель справа только превью.
        </p>
      </aside>
      <div ref={stageRef} className="grid min-h-[420px] place-items-center overflow-hidden p-4">
        <div style={{ width: Math.round(widthPx * fit), height: Math.round(heightPx * fit) }}>
          <div
            ref={hostRef}
            className="origin-top-left bg-white shadow-[0_16px_40px_rgba(30,24,16,0.08)]"
            style={{ width: widthPx, height: heightPx, transform: `scale(${fit})` }}
          />
        </div>
      </div>
      <aside className="flex min-h-[320px] flex-col border-l border-line bg-card md:min-h-0">
        <Souvenir3dPreview
          printAreas={areas}
          activePrintAreaId={active.id}
          texturesByArea={textures}
          textureRevision={revision}
          caption="Превью модели. Печатается лист слева."
        />
      </aside>
    </div>
  );
}

export function editorAreas(product: ProductId) {
  return areasFor(product);
}

