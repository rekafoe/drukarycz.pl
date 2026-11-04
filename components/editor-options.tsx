"use client";

import type { ReactNode } from "react";
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
  CircleIcon,
  DuplicateIcon,
  EyeIcon,
  EyeOffIcon,
  FitIcon,
  FlipHIcon,
  FlipVIcon,
  ForwardIcon,
  ItalicIcon,
  LargerIcon,
  LineIcon,
  LockIcon,
  PhotoIcon,
  RectIcon,
  RedoIcon,
  RotateIcon,
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
  return (
    <div className="max-h-[48%] shrink-0 overflow-y-auto border-b border-line bg-card px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToolButton label="Tekst" tone="primary" onClick={onAddText}>
          <TextIcon />
        </ToolButton>
        <label
          title="Zdjęcie"
          aria-label="Zdjęcie"
          className="tool-kobalt grid h-10 w-10 cursor-pointer place-items-center rounded-xl"
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
        <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
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
            className="rounded-full border border-line bg-paper px-3.5 py-2 text-sm font-semibold disabled:opacity-35"
            disabled={sheetEmpty}
            onClick={onCopy}
          >
            {copyLabel}
          </button>
        ) : null}
        <div className="ml-auto flex flex-wrap gap-2">
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              aria-pressed={area.id === activeId}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold ${
                area.id === activeId ? "bg-(--a-cta) text-white" : "border border-line bg-paper text-ink hover:border-(--a-mark)"
              }`}
              onClick={() => onActiveId(area.id)}
            >
              {area.label}
            </button>
          ))}
        </div>
      </div>

      {hasSelection ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="flex min-w-36 flex-1 items-center gap-2 text-sm">
            <span className="text-muted">Krycie</span>
            <input
              type="range"
              min={10}
              max={100}
              value={opacity}
              aria-label="Krycie"
              disabled={locked}
              className="min-w-16 flex-1 accent-kobalt"
              onChange={(event) => onOpacity(Number(event.target.value))}
            />
          </label>
          <ToolButton label="Odbij w poziomie" disabled={locked} onClick={() => onFlip("x")}>
            <FlipHIcon />
          </ToolButton>
          <ToolButton label="Odbij w pionie" disabled={locked} onClick={() => onFlip("y")}>
            <FlipVIcon />
          </ToolButton>
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
          <ToolButton label={locked ? "Odblokuj" : "Zablokuj"} pressed={locked} onClick={onLock}>
            {locked ? <UnlockIcon /> : <LockIcon />}
          </ToolButton>
        </div>
      ) : null}

      <Group title="Figury i naklejki">
        <div className="flex flex-wrap gap-2">
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
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {stickers.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              aria-label={sticker.label}
              title={sticker.label}
              className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-paper hover:border-ink"
              onClick={() => onSticker(sticker.id)}
              dangerouslySetInnerHTML={{ __html: sticker.svg.replace("<svg ", '<svg class="h-6 w-6" ') }}
            />
          ))}
        </div>
      </Group>

      {hasSelection ? (
        <Group title="Ułożenie">
          <div className="flex flex-wrap gap-2">
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
          </div>
        </Group>
      ) : null}

      {textSelected ? (
        <Group title="Napis" startOpen>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm">
              <span className="sr-only">Czcionka</span>
              <select
                aria-label="Czcionka"
                value={fontId}
                disabled={locked}
                className="h-9 rounded-lg border border-line bg-paper px-2"
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
            <label className="flex items-center gap-1 text-sm">
              <span className="sr-only">Rozmiar napisu w milimetrach</span>
              <input
                type="number"
                min={3}
                max={80}
                value={textMm}
                aria-label="Rozmiar napisu w milimetrach"
                disabled={locked}
                className="h-9 w-16 rounded-lg border border-line bg-paper px-2"
                onChange={(event) => {
                  const mm = Number(event.target.value);
                  if (!Number.isFinite(mm)) return;
                  onTextMm(Math.min(80, Math.max(3, Math.round(mm))));
                }}
              />
              <span className="text-muted">mm</span>
            </label>
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <SpacingIcon />
            <span className="text-muted">Odstęp</span>
            <input
              type="range"
              min={-40}
              max={400}
              step={10}
              value={charSpacing}
              aria-label="Odstęp liter"
              disabled={locked}
              className="min-w-24 flex-1 accent-kobalt"
              onChange={(event) => onSpacing(Number(event.target.value))}
            />
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">Kolor</span>
            {inks.map((ink) => (
              <Swatch key={ink.id} label={ink.label} value={ink.value} selected={fill?.toLowerCase() === ink.value} onClick={() => onFill(ink.value)} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StrokeIcon />
            <span className="text-sm text-muted">Obwódka</span>
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
              className="w-24 accent-kobalt"
              onChange={(event) => onStrokeWidth(Number(event.target.value))}
            />
          </div>
        </Group>
      ) : null}

      {shapeSelected ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Kolor figury</span>
          {inks.map((ink) => (
            <Swatch key={`shape-${ink.id}`} label={ink.label} value={ink.value} selected={fill?.toLowerCase() === ink.value} onClick={() => onFill(ink.value)} />
          ))}
        </div>
      ) : null}

      {imageSelected ? (
        <Group title="Zdjęcie" startOpen>
          <ToolButton label="Na strefę" disabled={locked} onClick={onFit}>
            <FitIcon />
          </ToolButton>
          <div className="mt-2 grid gap-1">
            <CropSlider label="Z lewej" value={crop.left} disabled={locked} onChange={(left) => onCrop({ ...crop, left })} />
            <CropSlider label="Z prawej" value={crop.right} disabled={locked} onChange={(right) => onCrop({ ...crop, right })} />
            <CropSlider label="Z góry" value={crop.top} disabled={locked} onChange={(top) => onCrop({ ...crop, top })} />
            <CropSlider label="Z dołu" value={crop.bottom} disabled={locked} onChange={(bottom) => onCrop({ ...crop, bottom })} />
            <button type="button" className="mt-1 w-fit text-sm text-muted underline-offset-2 hover:underline" disabled={locked} onClick={onResetCrop}>
              Resetuj kadr
            </button>
          </div>
        </Group>
      ) : null}

      <Group title={`Warstwy (${layers.length})`}>
        {layers.length === 0 ? (
          <p className="text-sm text-muted">Pusty arkusz</p>
        ) : (
          <ul className="grid max-h-40 gap-1 overflow-y-auto">
            {layers.map((layer) => (
              <li key={layer.id} className={`flex items-center gap-1 rounded-lg px-1 ${layer.active ? "bg-paper" : ""}`}>
                <button type="button" className="min-w-0 flex-1 truncate px-1 py-1 text-left text-sm" onClick={() => onSelectLayer(layer.id)}>
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
      </Group>

      {issues.length > 0 ? (
        <ul className="mt-2 grid gap-1 text-sm text-muted" role="status">
          {issues.map((issue) => (
            <li key={`${issue.areaId}-${issue.code}`}>{issue.message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Group({ title, startOpen = false, children }: { title: string; startOpen?: boolean; children: ReactNode }) {
  return (
    <details
      ref={(node) => {
        if (!node || !startOpen || node.dataset.armed === "1") return;
        node.open = true;
        node.dataset.armed = "1";
      }}
      className="mt-2 rounded-xl border border-line bg-paper px-3 py-2"
    >
      <summary className="cursor-pointer text-sm font-semibold">{title}</summary>
      <div className="pt-2">{children}</div>
    </details>
  );
}

function Swatch({ label, value, selected, onClick }: { label: string; value: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={selected}
      className={`h-8 w-8 rounded-full border ${selected ? "border-ink ring-2 ring-ink ring-offset-2 ring-offset-card" : "border-line"}`}
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
    <label className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2 text-sm">
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
      className={`grid h-10 w-10 place-items-center rounded-xl disabled:cursor-default disabled:opacity-35 ${look} ${pressed ? "ring-2 ring-(--a-mark) ring-offset-1" : ""}`}
    >
      {children}
    </button>
  );
}
