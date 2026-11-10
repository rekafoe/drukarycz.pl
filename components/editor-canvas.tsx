"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, Circle, FabricImage, FabricObject, Line, Rect, StaticCanvas, Textbox, Triangle, loadSVGFromString, util } from "fabric";
import "@/app/print-fonts.css";
import { EditorOptions, type CropEdges, type EditorLayer, type ShapeKind, type ZoneAlign } from "@/components/editor-options";
import { Souvenir3dPreview } from "@/components/souvenir3d/Souvenir3dPreview";
import {
  DEFAULT_PRINT_AREA_MUG,
  DEFAULT_PRINT_AREAS_TSHIRT,
  type PrintAreaConfig,
} from "@/components/souvenir3d/types";
import { printAreaFabricPx, productionMultiplier } from "@/components/souvenir3d/scale";
import type { ProductId } from "@/lib/catalog";
import { isTextType, issuesForAreas, SAFE_MARGIN_MM } from "@/lib/print-quality";
import { fontByFamily, fontById, loadPrintFont } from "@/lib/print-fonts";
import { stickerById } from "@/lib/stickers";
import { defaultPrintText, inkForFabric, type QualityIssue } from "@/lib/work";

/** Как forcedPageSize у souvenir_3d: координаты зоны в масштабе 1. */
const SCENE_SCALE = 1;

const MAX_PRINT_BYTES = 8_000_000;

for (const key of ["merchKind", "merchName", "merchId"]) {
  if (!FabricObject.customProperties.includes(key)) FabricObject.customProperties.push(key);
}

export type EditorHandle = {
  exportProduction: () => Promise<Array<{ area: string; blob: Blob } | { area: string; error: "large" }>>;
};

type HistoryBucket = { past: string[]; future: string[] };

function isTextObject(object: { type?: string }) {
  return isTextType(object.type);
}

function isImageObject(object: { type?: string }) {
  return object.type?.toLowerCase() === "image";
}

function weightOf(value: unknown) {
  if (value === "bold") return 700;
  if (value === "normal") return 400;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 400;
}

function textMmOf(object: { get: (key: string) => unknown; scaleY?: number }, pxPerMm: number) {
  const font = object.get("fontSize");
  const scale = object.scaleY || 1;
  return Math.max(1, Math.round(((typeof font === "number" ? font : 32) * Math.abs(scale)) / pxPerMm));
}

function layerName(object: FabricObject) {
  const named = object.get("merchName");
  if (typeof named === "string" && named.trim()) return named.trim();
  if (isTextObject(object)) {
    const text = String(object.get("text") ?? "").trim().split("\n")[0] ?? "";
    return text ? text.slice(0, 28) : "Napis";
  }
  if (isImageObject(object)) return "Zdjęcie";
  if (object.type === "rect") return "Prostokąt";
  if (object.type === "circle") return "Koło";
  if (object.type === "triangle") return "Trójkąt";
  if (object.type === "line") return "Linia";
  return "Obiekt";
}

function newMerchId() {
  return Math.random().toString(36).slice(2, 10);
}

function paintInk(object: FabricObject, ink: string) {
  const fill = object.fill;
  const stroke = object.stroke;
  if (typeof fill === "string" && fill && fill !== "none" && fill !== "transparent") object.set("fill", ink);
  if (typeof stroke === "string" && stroke && stroke !== "none" && stroke !== "transparent") object.set("stroke", ink);
  const kids = (object as { getObjects?: () => FabricObject[] }).getObjects?.() ?? [];
  for (const kid of kids) paintInk(kid, ink);
}

function reflowText(object: FabricObject) {
  if (!isTextObject(object)) return;
  (object as { initDimensions?: () => void }).initDimensions?.();
}

function readCrop(image: FabricImage): CropEdges {
  const original = image.getOriginalSize();
  const width = original.width || image.width || 1;
  const height = original.height || image.height || 1;
  const cropX = image.cropX || 0;
  const cropY = image.cropY || 0;
  const shownW = image.width || width;
  const shownH = image.height || height;
  return {
    left: cropX / width,
    top: cropY / height,
    right: Math.max(0, (width - cropX - shownW) / width),
    bottom: Math.max(0, (height - cropY - shownH) / height),
  };
}

function clampEdge(value: number) {
  return Math.min(0.6, Math.max(0, value));
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

/** Фон листа — цвет ткани для экрана. В файл для печати и на модель он не входит. */
function pageWithoutSheetBackground(page: object): object {
  const copy = { ...(page as Record<string, unknown>) };
  delete copy.background;
  delete copy.backgroundColor;
  delete copy.overlay;
  delete copy.overlayColor;
  return copy;
}

/** Фон листа не входит в текстуру, поэтому белые чернила остаются на модели. */
function transparentPng(canvas: Canvas): string | null {
  if (canvas.getObjects().length === 0) return null;
  const previous = canvas.backgroundColor;
  canvas.backgroundColor = "";
  try {
    return canvas.toCanvasElement(1).toDataURL("image/png");
  } finally {
    canvas.backgroundColor = previous || "#ffffff";
  }
}

export function EditorCanvas({
  product,
  activeId,
  bodyColor,
  initialPages,
  onActiveId,
  onPreview,
  onPages,
  onIssues,
  onBind,
  onEditorReady,
  onEditorFailed,
}: {
  product: ProductId;
  activeId: string;
  bodyColor: string;
  initialPages: Record<string, object>;
  onActiveId: (id: string) => void;
  onPreview: (url: string | null) => void;
  onPages: (pages: Record<string, object>) => void;
  onIssues?: (issues: QualityIssue[]) => void;
  onBind?: (api: EditorHandle | null) => void;
  onEditorReady?: () => void;
  onEditorFailed?: () => void;
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
  const onIssuesRef = useRef(onIssues);
  onIssuesRef.current = onIssues;
  const onBindRef = useRef(onBind);
  onBindRef.current = onBind;
  const onEditorReadyRef = useRef(onEditorReady);
  const onEditorFailedRef = useRef(onEditorFailed);
  onEditorReadyRef.current = onEditorReady;
  onEditorFailedRef.current = onEditorFailed;
  const productRef = useRef(product);
  productRef.current = product;
  const pxPerMmRef = useRef(widthPx / active.widthMm);
  pxPerMmRef.current = widthPx / active.widthMm;
  const issuesKey = useRef("");
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
  const [imageSelected, setImageSelected] = useState(false);
  const [textFill, setTextFill] = useState<string | null>(null);
  const [textMm, setTextMm] = useState(12);
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [sheetReady, setSheetReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"model" | "sheet">("sheet");
  const [dragging, setDragging] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [locked, setLocked] = useState(false);
  const [shapeSelected, setShapeSelected] = useState(false);
  const [fontId, setFontId] = useState("manrope");
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [charSpacing, setCharSpacing] = useState(0);
  const [stroke, setStroke] = useState("");
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [crop, setCrop] = useState<CropEdges>({ left: 0, right: 0, top: 0, bottom: 0 });
  const [layers, setLayers] = useState<EditorLayer[]>([]);
  const quiet = useRef(false);
  const quietTimer = useRef(0);
  const readSelectionRef = useRef<() => void>(() => {});

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
      backgroundColor: bodyColor,
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;
    let stopped = false;
    setDragging(false);
    setCanDelete(false);
    setTextSelected(false);
    setImageSelected(false);
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
      if (!readyToEmit || applying.current || skipRemember.current || stopped || quiet.current) return;
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
      reportIssues();
      readSelectionRef.current();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (stopped) return;
        const url = transparentPng(canvas);
        const empty = canvas.getObjects().length === 0;
        if (!url && !empty) return;
        setTextures((prev) => ({ ...prev, [active.id]: url ?? "" }));
        setRevision((n) => n + 1);
        setSheetEmpty(empty);
        if (active.id === areasFor(product)[0]?.id) onPreviewRef.current(empty || !url ? null : url);
      }, 180);
    };

    const loadAbort = new AbortController();
    const saved = pages.current[active.id];
    const ready = saved
      ? canvas.loadFromJSON(saved, undefined, { signal: loadAbort.signal }).then(() => {
          if (!stopped) canvas.requestRenderAll();
        })
      : Promise.resolve();
    ready
      .then(() => {
        if (stopped) return;
        readyToEmit = true;
        const shot = JSON.stringify(canvas.toObject());
        const current = bucket();
        if (current.past.length === 0) current.past.push(shot);
        syncHistoryFlags();
        publish();
        window.requestAnimationFrame(() => {
          if (!stopped) setSheetReady(true);
        });
      })
      .catch(() => {
        // StrictMode снимает холст, пока loadFromJSON ещё не закончился.
      });

    const onChange = () => publish();
    const reportIssues = () => {
      const nextIssues = issuesForAreas(areasFor(product), pages.current);
      const key = JSON.stringify(nextIssues);
      if (key === issuesKey.current) return;
      issuesKey.current = key;
      setIssues(nextIssues);
      onIssuesRef.current?.(nextIssues);
    };
    const onSelect = () => readSelectionRef.current();
    const onDrag = () => setDragging(true);
    const onDragEnd = () => setDragging(false);
    canvas.on("object:modified", onChange);
    canvas.on("object:added", onChange);
    canvas.on("object:removed", onChange);
    canvas.on("text:changed", onChange);
    canvas.on("object:moving", onDrag);
    canvas.on("object:scaling", onDrag);
    canvas.on("object:rotating", onDrag);
    canvas.on("object:resizing", onDrag);
    canvas.on("mouse:up", onDragEnd);
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
      loadAbort.abort();
      publishRef.current = () => {};
      window.clearTimeout(timer);
      window.clearTimeout(quietTimer.current);
      // Иначе then() у loadFromJSON вызывает clear() уже после dispose и падает на clearRect.
      const retiring = canvas as Canvas & {
        clear: () => Canvas;
        renderAll: () => Canvas;
        requestRenderAll: () => Canvas;
      };
      retiring.clear = () => canvas;
      retiring.renderAll = () => canvas;
      retiring.requestRenderAll = () => canvas;
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [active.id, active.heightMm, active.widthMm, bodyColor, heightPx, product, widthPx]);

  function placeNew(object: FabricObject) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    object.set({
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      originX: "center",
      originY: "center",
    });
    if (!object.get("merchId")) object.set("merchId", newMerchId());
    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
  }

  function readSelection() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    const activeObjects = canvas.getActiveObjects();
    setLayers(
      objects
        .map((object, index) => ({
          id: String(object.get("merchId") || `n-${index}`),
          name: layerName(object),
          visible: object.visible !== false,
          locked: Boolean(object.lockMovementX),
          active: activeObjects.includes(object),
        }))
        .reverse(),
    );
    setHasSelection(activeObjects.length > 0);
    setCanDelete(activeObjects.some((object) => !object.lockMovementX));
    const text = activeObjects.find((object) => isTextObject(object));
    const image = activeObjects.find((object): object is FabricImage => isImageObject(object));
    const shape = activeObjects.find((object) => {
      const kind = object.get("merchKind");
      return kind === "shape" || kind === "sticker";
    });
    setTextSelected(Boolean(text));
    setImageSelected(Boolean(image));
    setShapeSelected(Boolean(shape) && !text);
    if (text) {
      const fill = text.get("fill");
      setTextFill(typeof fill === "string" ? fill : null);
      setTextMm(textMmOf(text, widthPx / active.widthMm));
      setFontId(fontByFamily(String(text.get("fontFamily") || "Manrope")).id);
      setBold(weightOf(text.get("fontWeight")) >= 600);
      setItalic(String(text.get("fontStyle") || "").includes("italic"));
      const align = text.get("textAlign");
      setTextAlign(align === "left" || align === "right" ? align : "center");
      const spacing = Number(text.get("charSpacing"));
      setCharSpacing(Number.isFinite(spacing) ? spacing : 0);
      const width = Number(text.get("strokeWidth"));
      setStrokeWidth(Number.isFinite(width) ? width : 0);
      const strokeValue = text.get("stroke");
      setStroke(typeof strokeValue === "string" ? strokeValue : "");
    } else if (shape) {
      const fill = shape.get("fill");
      const strokeValue = shape.get("stroke");
      const ink = typeof fill === "string" && fill ? fill : strokeValue;
      setTextFill(typeof ink === "string" ? ink : null);
    }
    if (image) setCrop(readCrop(image));
    const current = canvas.getActiveObject();
    if (current) {
      const value = Number(current.opacity);
      setOpacity(Number.isFinite(value) ? Math.round(value * 100) : 100);
      setLocked(Boolean(current.lockMovementX));
    } else {
      setOpacity(100);
      setLocked(false);
    }
  }
  readSelectionRef.current = readSelection;

  function previewQuiet(mutate: () => void) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    quiet.current = true;
    mutate();
    canvas.requestRenderAll();
    publishRef.current();
    window.clearTimeout(quietTimer.current);
    quietTimer.current = window.setTimeout(() => {
      quiet.current = false;
      publishRef.current();
    }, 320);
  }

  async function addText() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const font = fontById(fontId);
    const weight = bold ? 800 : 400;
    const style = italic && font.italic ? "italic" : "normal";
    await loadPrintFont(font.family, weight === 800 ? 700 : weight, style === "italic");
    if (fabricRef.current !== canvas) return;
    const ink = inkForFabric(bodyColor);
    const text = new Textbox(defaultPrintText, {
      width: canvas.getWidth() * 0.72,
      fontFamily: font.family,
      fontSize: Math.round(canvas.getWidth() / 8),
      fontWeight: weight,
      fontStyle: style,
      textAlign,
      charSpacing,
      fill: ink,
      stroke: strokeWidth > 0 ? stroke || ink : "",
      strokeWidth: strokeWidth > 0 ? strokeWidth : 0,
      strokeLineJoin: "round",
    });
    text.set("paintFirst", "stroke");
    text.set("merchKind", "text");
    text.set("merchId", newMerchId());
    placeNew(text);
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
    image.set("merchKind", "image");
    image.set("merchName", "Zdjęcie");
    image.set("merchId", newMerchId());
    canvas.add(image);
    canvas.setActiveObject(image);
    canvas.requestRenderAll();
  }

  function removeSelected() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const selected = canvas.getActiveObjects().filter((object) => !object.lockMovementX);
    if (selected.length === 0) return;
    canvas.remove(...selected);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
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
    if (!canvas || !activeObject || activeObject.lockMovementX) return;
    canvas.centerObject(activeObject);
    activeObject.setCoords();
    touch();
  }

  function rotateSelected() {
    const canvas = fabricRef.current;
    const activeObject = canvas?.getActiveObject();
    if (!canvas || !activeObject || activeObject.lockMovementX) return;
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
      if (object.lockMovementX) continue;
      if (isTextObject(object)) {
        const current = object.get("fontSize");
        const size = Math.round((typeof current === "number" ? current : 32) * factor);
        object.set("fontSize", Math.min(240, Math.max(12, size)));
        setTextMm(readTextMm(object));
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
      clone.set({
        left: (clone.left || 0) + 24,
        top: (clone.top || 0) + 24,
        lockMovementX: false,
        lockMovementY: false,
        lockScalingX: false,
        lockScalingY: false,
        lockRotation: false,
        hasControls: true,
      });
      if (isTextObject(clone)) clone.set("editable", true);
      clone.set("merchId", newMerchId());
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
      if (object.lockMovementX) continue;
      if (forward) canvas.bringObjectForward(object);
      else canvas.sendObjectBackwards(object);
    }
    touch();
  }

  function readTextMm(object: { get: (key: string) => unknown; scaleY?: number }) {
    return textMmOf(object, widthPx / active.widthMm);
  }

  function applyTextMm(mm: number) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const pxPerMm = widthPx / active.widthMm;
    const texts = canvas.getActiveObjects().filter((object) => isTextObject(object) && !object.lockMovementX);
    if (texts.length === 0) return;
    for (const object of texts) {
      const scale = object.scaleY || 1;
      const px = Math.round((mm * pxPerMm) / Math.abs(scale || 1));
      object.set("fontSize", Math.min(240, Math.max(8, px)));
      object.setCoords();
    }
    setTextMm(mm);
    touch();
  }

  function alignSelected(side: ZoneAlign) {
    const canvas = fabricRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object || object.lockMovementX) return;
    const bounds = object.getBoundingRect();
    const margin = SAFE_MARGIN_MM * (widthPx / active.widthMm);
    let dx = 0;
    let dy = 0;
    if (side === "left") dx = margin - bounds.left;
    else if (side === "right") dx = canvas.getWidth() - margin - (bounds.left + bounds.width);
    else if (side === "center") dx = (canvas.getWidth() - bounds.width) / 2 - bounds.left;
    else if (side === "top") dy = margin - bounds.top;
    else if (side === "bottom") dy = canvas.getHeight() - margin - (bounds.top + bounds.height);
    else dy = (canvas.getHeight() - bounds.height) / 2 - bounds.top;
    object.set({ left: (object.left || 0) + dx, top: (object.top || 0) + dy });
    object.setCoords();
    touch();
  }

  function fitSelected() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const images = canvas.getActiveObjects().filter((object) => isImageObject(object) && !object.lockMovementX);
    if (images.length === 0) return;
    for (const image of images) {
      const scale = Math.min(canvas.getWidth() / Math.max(image.width || 1, 1), canvas.getHeight() / Math.max(image.height || 1, 1));
      image.set({ scaleX: scale, scaleY: scale, originX: "center", originY: "center" });
      canvas.centerObject(image);
      image.setCoords();
    }
    touch();
  }

  function moveSelected(dx: number, dy: number) {
    const canvas = fabricRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object || object.lockMovementX) return;
    object.set({ left: (object.left || 0) + dx, top: (object.top || 0) + dy });
    object.setCoords();
    touch();
  }

  function copyZone() {
    const canvas = fabricRef.current;
    const zones = areasFor(product);
    const current = zones.find((area) => area.id === areaIdRef.current);
    const other = zones.find((area) => area.id !== areaIdRef.current);
    if (!canvas || !current || !other || canvas.getObjects().length === 0) return;
    const agreed = window.confirm(
      `Zastąpić strefę ${other.label} kopią strefy ${current.label}? Obecny projekt tej strefy zniknie.`,
    );
    if (!agreed) return;
    pages.current[other.id] = canvas.toObject();
    delete histories.current[other.id];
    publishRef.current();
  }

  function paintText(fill: string) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const targets = canvas.getActiveObjects().filter((object) => !object.lockMovementX);
    if (targets.length === 0) return;
    for (const object of targets) {
      if (object.type === "line") object.set("stroke", fill);
      else if (object.get("merchKind") === "sticker") paintInk(object, fill);
      else object.set("fill", fill);
    }
    setTextFill(fill);
    touch();
  }

  function editableObjects() {
    return fabricRef.current?.getActiveObjects().filter((object) => !object.lockMovementX) ?? [];
  }

  function textsOf() {
    return editableObjects().filter((object) => isTextObject(object));
  }

  async function applyFont(id: string) {
    const font = fontById(id);
    const nextItalic = italic && font.italic;
    const weight = bold ? 800 : 400;
    await loadPrintFont(font.family, weight === 800 ? 700 : weight, nextItalic);
    for (const object of textsOf()) {
      object.set({ fontFamily: font.family, fontWeight: weight, fontStyle: nextItalic ? "italic" : "normal" });
      reflowText(object);
    }
    setFontId(font.id);
    if (!font.italic) setItalic(false);
    touch();
  }

  async function applyBold() {
    const next = !bold;
    const font = fontById(fontId);
    await loadPrintFont(font.family, next ? 700 : 400, italic && font.italic);
    for (const object of textsOf()) {
      object.set("fontWeight", next ? 800 : 400);
      reflowText(object);
    }
    setBold(next);
    touch();
  }

  async function applyItalic() {
    const font = fontById(fontId);
    if (!font.italic) return;
    const next = !italic;
    await loadPrintFont(font.family, bold ? 700 : 400, next);
    for (const object of textsOf()) {
      object.set("fontStyle", next ? "italic" : "normal");
      reflowText(object);
    }
    setItalic(next);
    touch();
  }

  function applyTextAlign(side: "left" | "center" | "right") {
    for (const object of textsOf()) {
      object.set("textAlign", side);
      reflowText(object);
    }
    setTextAlign(side);
    touch();
  }

  function applySpacing(value: number) {
    previewQuiet(() => {
      for (const object of textsOf()) {
        object.set("charSpacing", value);
        reflowText(object);
      }
    });
    setCharSpacing(value);
  }

  function applyStroke(color: string) {
    const width = strokeWidth > 0 ? strokeWidth : 2;
    for (const object of textsOf()) {
      object.set({ stroke: color, strokeWidth: width, strokeLineJoin: "round" });
      object.set("paintFirst", "stroke");
    }
    setStroke(color);
    setStrokeWidth(width);
    touch();
  }

  function applyStrokeWidth(width: number) {
    const next = Math.min(8, Math.max(0, width));
    previewQuiet(() => {
      for (const object of textsOf()) {
        object.set({
          strokeWidth: next,
          stroke: next > 0 ? stroke || "#ffffff" : "",
          strokeLineJoin: "round",
        });
        object.set("paintFirst", "stroke");
      }
    });
    setStrokeWidth(next);
    if (next > 0 && !stroke) setStroke("#ffffff");
  }

  function applyOpacity(value: number) {
    const canvas = fabricRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object || object.lockMovementX) return;
    previewQuiet(() => object.set("opacity", value / 100));
    setOpacity(value);
  }

  function flipSelected(axis: "x" | "y") {
    const canvas = fabricRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object || object.lockMovementX) return;
    if (axis === "x") object.set("flipX", !object.flipX);
    else object.set("flipY", !object.flipY);
    object.setCoords();
    touch();
  }

  function applyCrop(next: CropEdges) {
    const left = clampEdge(next.left);
    const right = clampEdge(next.right);
    const top = clampEdge(next.top);
    const bottom = clampEdge(next.bottom);
    const edges = {
      left,
      right: left + right > 0.85 ? Math.max(0, 0.85 - left) : right,
      top,
      bottom: top + bottom > 0.85 ? Math.max(0, 0.85 - top) : bottom,
    };
    previewQuiet(() => {
      for (const object of editableObjects()) {
        if (!isImageObject(object)) continue;
        const image = object as FabricImage;
        const original = image.getOriginalSize();
        const visualW = (image.width || original.width || 1) * (image.scaleX || 1);
        const visualH = (image.height || original.height || 1) * (image.scaleY || 1);
        const cropX = Math.round(original.width * edges.left);
        const cropY = Math.round(original.height * edges.top);
        const width = Math.max(1, Math.round(original.width * (1 - edges.left - edges.right)));
        const height = Math.max(1, Math.round(original.height * (1 - edges.top - edges.bottom)));
        image.set({ cropX, cropY, width, height, scaleX: visualW / width, scaleY: visualH / height });
        image.setCoords();
      }
    });
    setCrop(edges);
  }

  function findLayer(id: string) {
    return fabricRef.current?.getObjects().find((object, index) => String(object.get("merchId") || `n-${index}`) === id);
  }

  function setObjectLocked(object: FabricObject, next: boolean) {
    object.set({
      lockMovementX: next,
      lockMovementY: next,
      lockScalingX: next,
      lockScalingY: next,
      lockRotation: next,
      hasControls: !next,
    });
    if (isTextObject(object)) object.set("editable", !next);
  }

  function toggleLock(id?: string) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = id ? [findLayer(id)].filter((object): object is FabricObject => Boolean(object)) : canvas.getActiveObjects();
    if (objects.length === 0) return;
    const next = !objects[0].lockMovementX;
    for (const object of objects) setObjectLocked(object, next);
    touch();
  }

  function toggleVisible(id: string) {
    const canvas = fabricRef.current;
    const object = findLayer(id);
    if (!canvas || !object) return;
    const show = object.visible === false;
    object.set("visible", show);
    if (!show && canvas.getActiveObjects().includes(object)) canvas.discardActiveObject();
    canvas.requestRenderAll();
    touch();
  }

  function selectLayer(id: string) {
    const canvas = fabricRef.current;
    const object = findLayer(id);
    if (!canvas || !object) return;
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    readSelection();
  }

  async function addShape(kind: ShapeKind) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const ink = inkForFabric(bodyColor);
    const width = canvas.getWidth() * 0.28;
    let object: FabricObject;
    if (kind === "rect") {
      object = new Rect({ width, height: width * 0.62, rx: 18, ry: 18, fill: ink });
      object.set("merchName", "Prostokąt");
    } else if (kind === "circle") {
      object = new Circle({ radius: width / 2, fill: ink });
      object.set("merchName", "Koło");
    } else if (kind === "triangle") {
      object = new Triangle({ width, height: width * 0.86, fill: ink });
      object.set("merchName", "Trójkąt");
    } else {
      object = new Line([0, 0, width, 0], { stroke: ink, strokeWidth: Math.max(12, width / 14), strokeLineCap: "round" });
      object.set("merchName", "Linia");
    }
    object.set("merchKind", "shape");
    object.set("merchId", newMerchId());
    placeNew(object);
  }

  async function addSticker(id: string) {
    const sticker = stickerById(id);
    const canvas = fabricRef.current;
    if (!sticker || !canvas) return;
    const parsed = await loadSVGFromString(sticker.svg);
    if (fabricRef.current !== canvas) return;
    const parts = parsed.objects.filter((item): item is FabricObject => item !== null);
    if (parts.length === 0) return;
    const grouped = util.groupSVGElements(parts);
    const ink = inkForFabric(bodyColor);
    paintInk(grouped, ink);
    const target = canvas.getWidth() * 0.28;
    const scale = target / Math.max(grouped.width || 64, grouped.height || 64, 1);
    grouped.scaleX = scale;
    grouped.scaleY = scale;
    grouped.set("merchKind", "sticker");
    grouped.set("merchName", sticker.label);
    grouped.set("merchId", newMerchId());
    placeNew(grouped);
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
    setImageSelected(false);
    setTextFill(null);
    setCanUndo(bucket.past.length > 1);
    setCanRedo(bucket.future.length > 0);
    canvas.requestRenderAll();
    skipRemember.current = true;
    publishRef.current();
    skipRemember.current = false;
  }

  const moveRef = useRef(moveSelected);
  const removeRef = useRef(removeSelected);
  const historyRef = useRef(stepHistory);
  const exportRef = useRef(exportProduction);
  moveRef.current = moveSelected;
  removeRef.current = removeSelected;
  historyRef.current = stepHistory;
  exportRef.current = exportProduction;

  useEffect(() => {
    onBindRef.current?.({
      exportProduction: () => exportRef.current(),
    });
    return () => onBindRef.current?.(null);
  }, []);

  useEffect(() => {
    if (sheetReady && modelReady) onEditorReadyRef.current?.();
  }, [sheetReady, modelReady]);

  useEffect(() => {
    const jobs = [
      loadPrintFont("Manrope", 400, false),
      loadPrintFont("Manrope", 700, false),
      loadPrintFont("Source Serif 4", 400, false),
      loadPrintFont("Source Serif 4", 700, false),
      loadPrintFont("Source Serif 4", 400, true),
      loadPrintFont("Source Serif 4", 700, true),
      loadPrintFont("Oswald", 400, false),
      loadPrintFont("Oswald", 700, false),
      loadPrintFont("Nunito", 400, false),
      loadPrintFont("Nunito", 700, false),
      loadPrintFont("Nunito", 400, true),
      loadPrintFont("Nunito", 700, true),
      loadPrintFont("Caveat", 400, false),
      loadPrintFont("Caveat", 700, false),
    ];
    void Promise.all(jobs);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      }
      const editing = fabricRef.current?.getActiveObject() as { isEditing?: boolean } | undefined;
      if (editing?.isEditing) return;
      const px = pxPerMmRef.current;
      const step = event.shiftKey ? px * 5 : px;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveRef.current(-step, 0);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveRef.current(step, 0);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveRef.current(0, -step);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        moveRef.current(0, step);
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removeRef.current();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        void historyRef.current(event.shiftKey);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        void historyRef.current(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function exportProduction() {
    const canvas = fabricRef.current;
    if (canvas) pages.current[areaIdRef.current] = canvas.toObject();
    const files: Array<{ area: string; blob: Blob } | { area: string; error: "large" }> = [];
    for (const area of areasFor(productRef.current)) {
      const page = pages.current[area.id];
      if (!page) continue;
      const objects = (page as { objects?: unknown[] }).objects;
      if (!Array.isArray(objects) || objects.length === 0) continue;
      const { widthPx: areaWidth, heightPx: areaHeight } = printAreaFabricPx(area.widthMm, area.heightMm, SCENE_SCALE);
      const host = document.createElement("canvas");
      const off = new StaticCanvas(host, {
        width: areaWidth,
        height: areaHeight,
        backgroundColor: "",
        renderOnAddRemove: false,
      });
      try {
        await document.fonts.ready;
        await off.loadFromJSON(pageWithoutSheetBackground(page));
        off.backgroundColor = "";
        off.backgroundImage = undefined;
        off.overlayColor = "";
        off.overlayImage = undefined;
        if (off.getObjects().length === 0) continue;
        const painted = off.toCanvasElement(productionMultiplier(areaWidth, area.widthMm));
        const blob = await new Promise<Blob | null>((resolve) => painted.toBlob((value) => resolve(value), "image/png"));
        if (!blob || blob.size === 0) continue;
        if (blob.size > MAX_PRINT_BYTES) files.push({ area: area.id, error: "large" });
        else files.push({ area: area.id, blob });
      } finally {
        void off.dispose();
      }
    }
    return files;
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
  const copyLabel = areas.length > 1 ? (active.id === "back" ? "Kopiuj na przód" : "Kopiuj na tył") : null;
  const backEmpty = active.id === "back" && sheetEmpty;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-2 text-sm lg:hidden">
        <button
          type="button"
          className={`border-b-2 pb-0.5 ${mobilePanel === "model" ? "border-(--a-mark) font-semibold text-ink" : "border-transparent text-muted"}`}
          onClick={() => setMobilePanel("model")}
        >
          Rzecz
        </button>
        <button
          type="button"
          className={`border-b-2 pb-0.5 ${mobilePanel === "sheet" ? "border-(--a-mark) font-semibold text-ink" : "border-transparent text-muted"}`}
          onClick={() => setMobilePanel("sheet")}
        >
          Arkusz
        </button>
        {areas.length > 1 ? (
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {areas.map((area) => (
              <button
                key={area.id}
                type="button"
                aria-pressed={area.id === active.id}
                className={`rounded-full px-2.5 py-0.5 text-sm ${
                  area.id === active.id ? "bg-(--a-cta) text-white font-semibold" : "text-muted"
                }`}
                onClick={() => onActiveId(area.id)}
              >
                {area.label}
              </button>
            ))}
            {mobilePanel === "sheet" && copyLabel ? (
              <button
                type="button"
                className="rounded-full border border-line bg-card px-2.5 py-0.5 text-sm font-semibold text-ink disabled:opacity-35"
                disabled={sheetEmpty}
                onClick={copyZone}
              >
                {copyLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {mobilePanel === "sheet" && backEmpty ? (
        <p className="shrink-0 border-b border-line px-4 py-1 text-[11px] tracking-wide text-muted lg:hidden">Tył jeszcze pusty</p>
      ) : null}
      <div className="grid min-h-0 min-w-0 flex-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <aside className={`${sheetHidden ? "hidden" : "flex"} min-h-0 min-w-0 flex-row overflow-hidden lg:flex lg:border-r lg:border-line`}>
        <EditorOptions
          areas={areas.map((area) => ({ id: area.id, label: area.label }))}
          activeId={active.id}
          onActiveId={onActiveId}
          canUndo={canUndo}
          canRedo={canRedo}
          hasSelection={hasSelection}
          locked={locked}
          sheetEmpty={sheetEmpty}
          textSelected={textSelected}
          imageSelected={imageSelected}
          shapeSelected={shapeSelected}
          fontId={fontId}
          italicAvailable={fontById(fontId).italic}
          bold={bold}
          italic={italic}
          textAlign={textAlign}
          textMm={textMm}
          charSpacing={charSpacing}
          fill={textFill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          crop={crop}
          layers={layers}
          issues={issues}
          copyLabel={copyLabel}
          dragging={dragging}
          onAddText={() => void addText()}
          onAddPhoto={(file) => void addPhoto(file)}
          onUndo={() => void stepHistory(false)}
          onRedo={() => void stepHistory(true)}
          onDelete={removeSelected}
          onShape={(kind) => void addShape(kind)}
          onSticker={(id) => void addSticker(id)}
          onFont={(id) => void applyFont(id)}
          onBold={() => void applyBold()}
          onItalic={() => void applyItalic()}
          onTextAlign={applyTextAlign}
          onTextMm={applyTextMm}
          onSpacing={applySpacing}
          onFill={paintText}
          onStroke={applyStroke}
          onStrokeWidth={applyStrokeWidth}
          onOpacity={applyOpacity}
          onFlip={flipSelected}
          onAlign={alignSelected}
          onCenter={centerSelected}
          onRotate={rotateSelected}
          onDuplicate={() => void duplicateSelected()}
          onResize={resizeSelected}
          onLift={liftSelected}
          onFit={fitSelected}
          onCrop={applyCrop}
          onResetCrop={() => applyCrop({ left: 0, right: 0, top: 0, bottom: 0 })}
          onLock={() => toggleLock()}
          onSelectLayer={selectLayer}
          onToggleVisible={toggleVisible}
          onToggleLock={(id) => toggleLock(id)}
          onCopy={copyZone}
        />
        <div ref={stageRef} className="grid min-h-0 flex-1 place-items-center overflow-hidden px-3 py-3">
          <div className="grid justify-items-center gap-1">
            <span className="text-[11px] tracking-wide text-muted">
              {active.widthMm} mm · margines {SAFE_MARGIN_MM} mm
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] tracking-wide text-muted [writing-mode:vertical-rl] rotate-180">
                {active.heightMm} mm
              </span>
              <div className="relative overflow-hidden" style={{ width: sheetW, height: sheetH }}>
                <div
                  ref={hostRef}
                  className="absolute top-0 left-0 origin-top-left shadow-[0_0_0_2px_#2F5BFF66]"
                  style={{ width: widthPx, height: heightPx, transform: `scale(${fit})`, background: bodyColor }}
                />
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                  <div
                    className="absolute border border-dashed"
                    style={{
                      inset: SAFE_MARGIN_MM * (widthPx / active.widthMm) * fit,
                      borderColor: inkForFabric(bodyColor) === "#ffffff" ? "rgba(255,255,255,0.55)" : "rgba(26,25,22,0.35)",
                    }}
                  />
                  <div
                    className="absolute top-0 left-1/2 h-full w-px"
                    style={{ background: inkForFabric(bodyColor) === "#ffffff" ? "rgba(255,255,255,0.35)" : "rgba(26,25,22,0.2)" }}
                  />
                  <div
                    className="absolute top-1/2 left-0 h-px w-full"
                    style={{ background: inkForFabric(bodyColor) === "#ffffff" ? "rgba(255,255,255,0.35)" : "rgba(26,25,22,0.2)" }}
                  />
                </div>
                {sheetEmpty ? (
                  <p
                    className="pointer-events-none absolute inset-0 grid place-items-center text-sm"
                    style={{ color: inkForFabric(bodyColor) === "#ffffff" ? "rgba(255,255,255,0.72)" : "var(--muted)" }}
                  >
                    {backEmpty ? "Tył jeszcze pusty" : "Tekst, zdjęcie albo kształt"}
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
          onModelReady={() => setModelReady(true)}
          onModelError={() => onEditorFailedRef.current?.()}
        />
      </div>
      </div>
    </div>
  );
}

export function editorAreas(product: ProductId) {
  return areasFor(product);
}

