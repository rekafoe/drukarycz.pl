"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AlignBottomIcon,
  AlignCenterIcon,
  AlignLeftIcon,
  AlignMiddleIcon,
  AlignRightIcon,
  AlignTopIcon,
  BackwardIcon,
  BoldIcon,
  CenterIcon,
  ChevronIcon,
  CircleIcon,
  CropIcon,
  DuplicateIcon,
  EyeIcon,
  EyeOffIcon,
  FitIcon,
  FlipHIcon,
  FlipVIcon,
  ForwardIcon,
  ItalicIcon,
  LargerIcon,
  LayersIcon,
  LineIcon,
  LockIcon,
  PhotoIcon,
  RectIcon,
  RedoIcon,
  RotateIcon,
  ShapesIcon,
  SmallerIcon,
  SpacingIcon,
  StrokeIcon,
  TextIcon,
  TrashIcon,
  TriangleIcon,
  UndoIcon,
  UnlockIcon,
} from "@/components/editor-icons";
import { printFonts } from "@/lib/print-fonts";
import { stickers } from "@/lib/stickers";

const inks = [
  { id: "czarny", label: "Czarny", value: "#1a1916" },
  { id: "bordowy", label: "Bordowy", value: "#7d1d1d" },
  { id: "granatowy", label: "Granatowy", value: "#1e3a5f" },
  { id: "bialy", label: "Biały", value: "#ffffff" },
] as const;

export type EditorLayer = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  active: boolean;
};

export type CropEdges = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type ZoneAlign = "left" | "center" | "right" | "top" | "middle" | "bottom";
export type ShapeKind = "rect" | "circle" | "triangle" | "line";

type Issue = { areaId: string; code: string; message: string };
type Tray = "graphics" | "layers" | "arrange" | "crop" | null;

export function EditorOptions({
  areas,
  activeId,
  onActiveId,
  canUndo,
  canRedo,
  hasSelection,
  locked,
  sheetEmpty,
  textSelected,
  imageSelected,
  shapeSelected,
  fontId,
  italicAvailable,
  bold,
  italic,
  textAlign,
  textMm,
  charSpacing,
  fill,
  stroke,
  strokeWidth,
  opacity,
  crop,
  layers,
  issues,
  copyLabel,
  onAddText,
  onAddPhoto,
  onUndo,
  onRedo,
  onDelete,
  onShape,
  onSticker,
  onFont,
  onBold,
  onItalic,
  onTextAlign,
  onTextMm,
  onSpacing,
  onFill,
  onStroke,
  onStrokeWidth,
  onOpacity,
  onFlip,
  onAlign,
  onCenter,
  onRotate,
  onDuplicate,
  onResize,
  onLift,
  onFit,
  onCrop,
  onResetCrop,
  onLock,
  onSelectLayer,
  onToggleVisible,
  onToggleLock,
  onCopy,
}: {
  areas: Array<{ id: string; label: string }>;
  activeId: string;
  onActiveId: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  locked: boolean;
  sheetEmpty: boolean;
  textSelected: boolean;
  imageSelected: boolean;
  shapeSelected: boolean;
  fontId: string;
  italicAvailable: boolean;
  bold: boolean;
  italic: boolean;
  textAlign: "left" | "center" | "right";
  textMm: number;
  charSpacing: number;
  fill: string | null;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  crop: CropEdges;
  layers: EditorLayer[];
  issues: Issue[];
  copyLabel: string | null;
  onAddText: () => void;
  onAddPhoto: (file: File) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onShape: (kind: ShapeKind) => void;
  onSticker: (id: string) => void;
  onFont: (id: string) => void;
  onBold: () => void;
  onItalic: () => void;
  onTextAlign: (side: "left" | "center" | "right") => void;
  onTextMm: (mm: number) => void;
  onSpacing: (value: number) => void;
  onFill: (value: string) => void;
  onStroke: (value: string) => void;
  onStrokeWidth: (value: number) => void;
  onOpacity: (value: number) => void;
  onFlip: (axis: "x" | "y") => void;
  onAlign: (side: ZoneAlign) => void;
  onCenter: () => void;
  onRotate: () => void;
  onDuplicate: () => void;
  onResize: (factor: number) => void;
  onLift: (forward: boolean) => void;
  onFit: () => void;
  onCrop: (edges: CropEdges) => void;
  onResetCrop: () => void;
  onLock: () => void;
  onSelectLayer: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLock: (id: string) => void;
  onCopy: () => void;
}) {
  const font = printFonts.find((item) => item.id === fontId) ?? printFonts[0];
  const [tray, setTray] = useState<Tray>(null);

  useEffect(() => {
    if (!imageSelected) setTray((current) => (current === "crop" ? null : current));
  }, [imageSelected]);

  useEffect(() => {
    if (!hasSelection) setTray((current) => (current === "arrange" || current === "crop" ? null : current));
  }, [hasSelection]);

  function toggle(id: Exclude<Tray, null>) {
    setTray((current) => (current === id ? null : id));
  }

  const alignTools = (
    <>
      <ToolButton label="Do lewej strefy" disabled={locked} onClick={() => onAlign("left")}>
        <AlignLeftIcon />
      </ToolButton>
      <ToolButton label="Środek strefy" disabled={locked} onClick={() => onAlign("center")}>
        <AlignCenterIcon />
      </ToolButton>
      <ToolButton label="Do prawej strefy" disabled={locked} onClick={() => onAlign("right")}>
        <AlignRightIcon />
      </ToolButton>
      <ToolButton label="Do góry strefy" disabled={locked} onClick={() => onAlign("top")}>
        <AlignTopIcon />
      </ToolButton>
      <ToolButton label="Środek pionowy strefy" disabled={locked} onClick={() => onAlign("middle")}>
        <AlignMiddleIcon />
      </ToolButton>
      <ToolButton label="Do dołu strefy" disabled={locked} onClick={() => onAlign("bottom")}>
        <AlignBottomIcon />
      </ToolButton>
    </>
  );

  const arrangeTools = (
    <>
      <ToolButton label="Środek" disabled={locked} onClick={onCenter}>
        <CenterIcon />
      </ToolButton>
      <ToolButton label="Obróć" disabled={locked} onClick={onRotate}>
        <RotateIcon />
      </ToolButton>
      <ToolButton label="Duplikuj" onClick={onDuplicate}>
        <DuplicateIcon />
      </ToolButton>
      <ToolButton label="Większy" disabled={locked} onClick={() => onResize(1.15)}>
        <LargerIcon />
      </ToolButton>
      <ToolButton label="Mniejszy" disabled={locked} onClick={() => onResize(1 / 1.15)}>
        <SmallerIcon />
      </ToolButton>
      <ToolButton label="Wyżej" disabled={locked} onClick={() => onLift(true)}>
        <ForwardIcon />
      </ToolButton>
      <ToolButton label="Niżej" disabled={locked} onClick={() => onLift(false)}>
        <BackwardIcon />
      </ToolButton>
    </>
  );

  return (
    <div className="shrink-0 border-b border-line bg-card">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5">
        <Cluster>
          <ToolButton label="Tekst" tone="primary" onClick={onAddText}>
            <TextIcon />
          </ToolButton>
          <label
            title="Zdjęcie"
            aria-label="Zdjęcie"
            className="tool-kobalt grid h-8 w-8 cursor-pointer place-items-center rounded-lg"
          >
            <PhotoIcon />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onAddPhoto(file);
                event.target.value = "";
              }}
            />
          </label>
          <TrayToggle label="Figury i naklejki" open={tray === "graphics"} onClick={() => toggle("graphics")}>
            <ShapesIcon />
          </TrayToggle>
        </Cluster>
        <Rule />
        <Cluster>
          <ToolButton label="Cofnij" disabled={!canUndo} onClick={onUndo}>
            <UndoIcon />
          </ToolButton>
          <ToolButton label="Ponów" disabled={!canRedo} onClick={onRedo}>
            <RedoIcon />
          </ToolButton>
          <ToolButton label="Usuń" disabled={!hasSelection || locked} onClick={onDelete}>
            <TrashIcon />
          </ToolButton>
          {copyLabel ? (
            <button
              type="button"
              className="h-8 rounded-full border border-line bg-paper px-2.5 text-xs font-semibold disabled:opacity-35"
              disabled={sheetEmpty}
              onClick={onCopy}
            >
              {copyLabel}
            </button>
          ) : null}
        </Cluster>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <TrayToggle label={`Warstwy (${layers.length})`} open={tray === "layers"} onClick={() => toggle("layers")}>
            <LayersIcon />
            <span className="min-w-3 text-[10px] font-bold">{layers.length}</span>
          </TrayToggle>
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              aria-pressed={area.id === activeId}
              className={`h-8 rounded-full px-3 text-xs font-semibold ${
                area.id === activeId ? "bg-(--a-cta) text-white" : "border border-line bg-paper text-ink hover:border-(--a-mark)"
              }`}
              onClick={() => onActiveId(area.id)}
            >
              {area.label}
            </button>
          ))}
        </div>
      </div>

      {tray === "graphics" ? (
        <TrayPanel label="Figury i naklejki">
          <ToolButton label="Prostokąt" onClick={() => onShape("rect")}>
            <RectIcon />
          </ToolButton>
          <ToolButton label="Koło" onClick={() => onShape("circle")}>
            <CircleIcon />
          </ToolButton>
          <ToolButton label="Trójkąt" onClick={() => onShape("triangle")}>
            <TriangleIcon />
          </ToolButton>
          <ToolButton label="Linia" onClick={() => onShape("line")}>
            <LineIcon />
          </ToolButton>
          <Rule />
          {stickers.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              aria-label={sticker.label}
              title={sticker.label}
              className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-paper hover:border-ink"
              onClick={() => onSticker(sticker.id)}
              dangerouslySetInnerHTML={{ __html: sticker.svg.replace("<svg ", '<svg class="h-4 w-4" ') }}
            />
          ))}
        </TrayPanel>
      ) : null}

      {tray === "layers" ? (
        <div className="border-t border-line bg-paper px-2 py-1.5" role="region" aria-label="Warstwy">
          {layers.length === 0 ? (
            <p className="text-xs text-muted">Pusty arkusz</p>
          ) : (
            <ul className="grid max-h-28 gap-0.5 overflow-y-auto">
              {layers.map((layer) => (
                <li key={layer.id} className={`flex items-center gap-1 rounded-md px-1 ${layer.active ? "bg-card" : ""}`}>
                  <button type="button" className="min-w-0 flex-1 truncate px-1 py-0.5 text-left text-xs" onClick={() => onSelectLayer(layer.id)}>
                    {layer.name}
                  </button>
                  <ToolButton label={layer.visible ? "Ukryj" : "Pokaż"} pressed={!layer.visible} onClick={() => onToggleVisible(layer.id)}>
                    {layer.visible ? <EyeIcon /> : <EyeOffIcon />}
                  </ToolButton>
                  <ToolButton label={layer.locked ? "Odblokuj" : "Zablokuj"} pressed={layer.locked} onClick={() => onToggleLock(layer.id)}>
                    {layer.locked ? <UnlockIcon /> : <LockIcon />}
                  </ToolButton>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {hasSelection ? (
        <div className="flex flex-wrap items-center gap-1 border-t border-line px-2 py-1">
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <span>Krycie</span>
            <input
              type="range"
              min={10}
              max={100}
              value={opacity}
              aria-label="Krycie"
              disabled={locked}
              className="w-20 accent-kobalt"
              onChange={(event) => onOpacity(Number(event.target.value))}
            />
          </label>
          <Rule />
          <ToolButton label="Odbij w poziomie" disabled={locked} onClick={() => onFlip("x")}>
            <FlipHIcon />
          </ToolButton>
          <ToolButton label="Odbij w pionie" disabled={locked} onClick={() => onFlip("y")}>
            <FlipVIcon />
          </ToolButton>
          <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-1">
            {alignTools}
            <Rule />
            {arrangeTools}
          </div>
          <div className="sm:hidden">
            <TrayToggle label="Ułożenie" open={tray === "arrange"} onClick={() => toggle("arrange")}>
              <CenterIcon />
            </TrayToggle>
          </div>
          <ToolButton label={locked ? "Odblokuj" : "Zablokuj"} pressed={locked} onClick={onLock}>
            {locked ? <UnlockIcon /> : <LockIcon />}
          </ToolButton>
          {imageSelected ? (
            <>
              <ToolButton label="Na strefę" disabled={locked} onClick={onFit}>
                <FitIcon />
              </ToolButton>
              <TrayToggle label="Kadr" open={tray === "crop"} onClick={() => toggle("crop")}>
                <CropIcon />
              </TrayToggle>
            </>
          ) : null}
        </div>
      ) : null}

      {tray === "arrange" ? (
        <TrayPanel label="Ułożenie" className="sm:hidden">
          {alignTools}
          <Rule />
          {arrangeTools}
        </TrayPanel>
      ) : null}

      {textSelected ? (
        <div className="flex flex-wrap items-center gap-1 border-t border-line px-2 py-1">
          <Cluster>
            <label className="text-xs">
              <span className="sr-only">Czcionka</span>
              <select
                aria-label="Czcionka"
                value={fontId}
                disabled={locked}
                className="h-8 max-w-36 rounded-lg border border-line bg-paper px-1.5 text-xs"
                style={{ fontFamily: font.family }}
                onChange={(event) => onFont(event.target.value)}
              >
                {printFonts.map((item) => (
                  <option key={item.id} value={item.id} style={{ fontFamily: item.family }}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <ToolButton label="Pogrubienie" pressed={bold} disabled={locked} onClick={onBold}>
              <BoldIcon />
            </ToolButton>
            <ToolButton
              label={italicAvailable ? "Kursywa" : "Ta czcionka nie ma kursywy"}
              pressed={italic}
              disabled={locked || !italicAvailable}
              onClick={onItalic}
            >
              <ItalicIcon />
            </ToolButton>
            <ToolButton label="Tekst do lewej" pressed={textAlign === "left"} disabled={locked} onClick={() => onTextAlign("left")}>
              <AlignLeftIcon />
            </ToolButton>
            <ToolButton label="Tekst na środek" pressed={textAlign === "center"} disabled={locked} onClick={() => onTextAlign("center")}>
              <AlignCenterIcon />
            </ToolButton>
            <ToolButton label="Tekst do prawej" pressed={textAlign === "right"} disabled={locked} onClick={() => onTextAlign("right")}>
              <AlignRightIcon />
            </ToolButton>
            <label className="flex items-center gap-1 text-xs">
              <span className="sr-only">Rozmiar napisu w milimetrach</span>
              <input
                type="number"
                min={3}
                max={80}
                value={textMm}
                aria-label="Rozmiar napisu w milimetrach"
                disabled={locked}
                className="h-8 w-12 rounded-lg border border-line bg-paper px-1.5 text-xs"
                onChange={(event) => {
                  const mm = Number(event.target.value);
                  if (!Number.isFinite(mm)) return;
                  onTextMm(Math.min(80, Math.max(3, Math.round(mm))));
                }}
              />
              <span className="text-muted">mm</span>
            </label>
            <label className="flex items-center gap-1 text-xs text-muted">
              <SpacingIcon />
              <span className="sr-only">Odstęp</span>
              <input
                type="range"
                min={-40}
                max={400}
                step={10}
                value={charSpacing}
                aria-label="Odstęp liter"
                disabled={locked}
                className="w-16 accent-kobalt"
                onChange={(event) => onSpacing(Number(event.target.value))}
              />
            </label>
          </Cluster>
          <Cluster>
            {inks.map((ink) => (
              <Swatch key={ink.id} label={ink.label} value={ink.value} selected={fill?.toLowerCase() === ink.value} onClick={() => onFill(ink.value)} />
            ))}
          </Cluster>
          <Cluster>
            <StrokeIcon />
            <Swatch label="Bez obwódki" value="transparent" selected={strokeWidth <= 0} onClick={() => onStrokeWidth(0)} />
            {inks.map((ink) => (
              <Swatch
                key={`stroke-${ink.id}`}
                label={`Obwódka ${ink.label}`}
                value={ink.value}
                selected={strokeWidth > 0 && stroke.toLowerCase() === ink.value}
                onClick={() => onStroke(ink.value)}
              />
            ))}
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={Math.round(strokeWidth)}
              aria-label="Grubość obwódki"
              disabled={locked}
              className="w-16 accent-kobalt"
              onChange={(event) => onStrokeWidth(Number(event.target.value))}
            />
          </Cluster>
        </div>
      ) : null}

      {shapeSelected ? (
        <div className="flex flex-wrap items-center gap-1 border-t border-line px-2 py-1">
          <span className="text-xs text-muted">Kolor figury</span>
          {inks.map((ink) => (
            <Swatch key={`shape-${ink.id}`} label={ink.label} value={ink.value} selected={fill?.toLowerCase() === ink.value} onClick={() => onFill(ink.value)} />
          ))}
        </div>
      ) : null}

      {tray === "crop" && imageSelected ? (
        <div className="border-t border-line bg-paper px-2 py-1.5" role="region" aria-label="Kadr">
          <div className="grid gap-1 sm:grid-cols-2">
            <CropSlider label="Z lewej" value={crop.left} disabled={locked} onChange={(left) => onCrop({ ...crop, left })} />
            <CropSlider label="Z prawej" value={crop.right} disabled={locked} onChange={(right) => onCrop({ ...crop, right })} />
            <CropSlider label="Z góry" value={crop.top} disabled={locked} onChange={(top) => onCrop({ ...crop, top })} />
            <CropSlider label="Z dołu" value={crop.bottom} disabled={locked} onChange={(bottom) => onCrop({ ...crop, bottom })} />
          </div>
          <button type="button" className="mt-1 text-xs text-muted underline-offset-2 hover:underline" disabled={locked} onClick={onResetCrop}>
            Resetuj kadr
          </button>
        </div>
      ) : null}

      {issues.length > 0 ? (
        <ul className="grid gap-0.5 border-t border-line px-2 py-1 text-xs text-muted" role="status">
          {issues.map((issue) => (
            <li key={`${issue.areaId}-${issue.code}`}>{issue.message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Cluster({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1">{children}</div>;
}

function Rule() {
  return <span className="mx-0.5 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />;
}

function TrayToggle({
  label,
  open,
  onClick,
  children,
}: {
  label: string;
  open: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={open}
      aria-pressed={open}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-0.5 rounded-lg border px-1.5 ${
        open ? "border-(--a-mark) bg-paper text-ink" : "border-line bg-paper text-ink hover:border-(--a-mark)"
      }`}
    >
      {children}
      <ChevronIcon className={`h-3 w-3 ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

function TrayPanel({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`border-t border-line bg-paper px-2 py-1.5 ${className}`} role="region" aria-label={label}>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}

function Swatch({ label, value, selected, onClick }: { label: string; value: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={selected}
      className={`h-6 w-6 rounded-full border ${selected ? "border-ink ring-2 ring-ink ring-offset-1 ring-offset-card" : "border-line"}`}
      style={{ background: value === "transparent" ? "linear-gradient(135deg,#fff 45%,#c44 50%,#fff 55%)" : value }}
      onClick={onClick}
    />
  );
}

function CropSlider({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const percent = Math.round(Math.min(60, Math.max(0, value * 100)));
  return (
    <label className="grid grid-cols-[4rem_1fr_1.75rem] items-center gap-1.5 text-xs">
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={60}
        value={percent}
        aria-label={`Kadr ${label.toLowerCase()}`}
        disabled={disabled}
        className="accent-kobalt"
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
      <span className="text-muted">{percent}</span>
    </label>
  );
}

function ToolButton({
  label,
  children,
  onClick,
  disabled,
  pressed,
  tone = "plain",
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  tone?: "primary" | "plain";
}) {
  const look =
    tone === "primary"
      ? "tool-kobalt"
      : "border border-line bg-paper text-ink hover:border-(--a-mark)";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg disabled:cursor-default disabled:opacity-35 ${look} ${pressed ? "ring-2 ring-(--a-mark) ring-offset-1" : ""}`}
    >
      {children}
    </button>
  );
}
