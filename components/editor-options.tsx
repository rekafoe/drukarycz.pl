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
type Tray = "graphics" | "layers" | null;

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
  const [folded, setFolded] = useState(false);

  useEffect(() => {
    setFolded(false);
  }, [hasSelection, textSelected, imageSelected, shapeSelected, tray]);

  function toggle(id: Exclude<Tray, null>) {
    setTray((current) => (current === id ? null : id));
    setFolded(false);
  }

  const panelOpen = !folded && (Boolean(tray) || hasSelection || issues.length > 0);
  const panelTitle = tray === "graphics" ? "Figury i naklejki" : tray === "layers" ? "Warstwy" : textSelected ? "Napis" : imageSelected ? "Zdjęcie" : shapeSelected ? "Figura" : hasSelection ? "Obiekt" : "Uwagi";

  return (
    <div className="relative flex h-full min-h-0 shrink-0">
      <nav className="relative z-10 flex w-11 shrink-0 flex-col items-center gap-1 border-r border-line bg-card py-2" aria-label="Narzędzia arkusza">
        <ToolButton
          label="Tekst"
          tone="primary"
          onClick={() => {
            setTray(null);
            onAddText();
          }}
        >
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
        <ToolButton label="Figury i naklejki" pressed={tray === "graphics"} onClick={() => toggle("graphics")}>
          <ShapesIcon />
        </ToolButton>
        <span className="my-1 h-px w-6 bg-line" aria-hidden="true" />
        <ToolButton label="Cofnij" disabled={!canUndo} onClick={onUndo}>
          <UndoIcon />
        </ToolButton>
        <ToolButton label="Ponów" disabled={!canRedo} onClick={onRedo}>
          <RedoIcon />
        </ToolButton>
        <ToolButton label="Usuń" disabled={!hasSelection || locked} onClick={onDelete}>
          <TrashIcon />
        </ToolButton>
        <ToolButton label={`Warstwy (${layers.length})`} pressed={tray === "layers"} onClick={() => toggle("layers")}>
          <LayersIcon />
        </ToolButton>
        <div className="mt-auto flex flex-col items-center gap-1 px-0.5">
          {copyLabel ? (
            <button
              type="button"
              title={copyLabel}
              aria-label={copyLabel}
              className="h-8 w-8 rounded-lg border border-line bg-paper text-[9px] font-bold leading-tight disabled:opacity-35"
              disabled={sheetEmpty}
              onClick={onCopy}
            >
              {activeId === "back" ? "Na przód" : "Na tył"}
            </button>
          ) : null}
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              aria-pressed={area.id === activeId}
              title={area.label}
              className={`h-8 w-8 rounded-lg text-[10px] font-semibold ${
                area.id === activeId ? "bg-(--a-cta) text-white" : "border border-line bg-paper text-ink hover:border-(--a-mark)"
              }`}
              onClick={() => onActiveId(area.id)}
            >
              {area.id === "front" ? "Prz" : area.id === "back" ? "Tył" : area.label.slice(0, 3)}
            </button>
          ))}
        </div>
      </nav>

      {panelOpen ? (
        <aside
          className="absolute top-0 bottom-0 left-11 z-20 flex w-56 flex-col overflow-y-auto border-r border-line bg-card shadow-[8px_0_24px_-16px_rgba(22,19,15,0.45)] lg:static lg:z-0 lg:shadow-none"
          aria-label={panelTitle}
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-2 py-1.5">
            <h2 className="text-xs font-semibold">{panelTitle}</h2>
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-paper hover:text-ink lg:hidden"
              aria-label="Zamknij panel"
              onClick={() => {
                setTray(null);
                setFolded(true);
              }}
            >
              ×
            </button>
          </div>

          {tray === "graphics" ? (
            <Section title="Figury i naklejki">
              <div className="flex flex-wrap gap-1">
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
              <div className="mt-1.5 flex flex-wrap gap-1">
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
              </div>
            </Section>
          ) : null}

          {tray === "layers" ? (
            <Section title="Warstwy">
              {layers.length === 0 ? (
                <p className="text-xs text-muted">Pusty arkusz</p>
              ) : (
                <ul className="grid max-h-40 gap-0.5 overflow-y-auto">
                  {layers.map((layer) => (
                    <li key={layer.id} className={`flex items-center gap-0.5 rounded-md px-0.5 ${layer.active ? "bg-paper" : ""}`}>
                      <button type="button" className="min-w-0 flex-1 truncate px-1 py-1 text-left text-xs" onClick={() => onSelectLayer(layer.id)}>
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
            </Section>
          ) : null}

          {hasSelection ? (
            <Section title="Ułożenie">
              <label className="flex items-center gap-1.5 text-xs text-muted">
                <span>Krycie</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={opacity}
                  aria-label="Krycie"
                  disabled={locked}
                  className="min-w-0 flex-1 accent-kobalt"
                  onChange={(event) => onOpacity(Number(event.target.value))}
                />
              </label>
              <div className="mt-1.5 flex flex-wrap gap-1">
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
                <ToolButton label={locked ? "Odblokuj" : "Zablokuj"} pressed={locked} onClick={onLock}>
                  {locked ? <UnlockIcon /> : <LockIcon />}
                </ToolButton>
              </div>
            </Section>
          ) : null}

          {textSelected ? (
            <Section title="Czcionka">
              <label className="block text-xs">
                <span className="sr-only">Czcionka</span>
                <select
                  aria-label="Czcionka"
                  value={fontId}
                  disabled={locked}
                  className="h-8 w-full rounded-lg border border-line bg-paper px-1.5 text-xs"
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
              <div className="mt-1.5 flex flex-wrap gap-1">
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
              </div>
              <label className="mt-1.5 flex items-center gap-1 text-xs">
                <span className="sr-only">Rozmiar napisu w milimetrach</span>
                <input
                  type="number"
                  min={3}
                  max={80}
                  value={textMm}
                  aria-label="Rozmiar napisu w milimetrach"
                  disabled={locked}
                  className="h-8 w-14 rounded-lg border border-line bg-paper px-1.5 text-xs"
                  onChange={(event) => {
                    const mm = Number(event.target.value);
                    if (!Number.isFinite(mm)) return;
                    onTextMm(Math.min(80, Math.max(3, Math.round(mm))));
                  }}
                />
                <span className="text-muted">mm</span>
              </label>
              <label className="mt-1.5 flex items-center gap-1 text-xs text-muted">
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
                  className="min-w-0 flex-1 accent-kobalt"
                  onChange={(event) => onSpacing(Number(event.target.value))}
                />
              </label>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {inks.map((ink) => (
                  <Swatch key={ink.id} label={ink.label} value={ink.value} selected={fill?.toLowerCase() === ink.value} onClick={() => onFill(ink.value)} />
                ))}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
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
              </div>
              <input
                type="range"
                min={0}
                max={8}
                step={1}
                value={Math.round(strokeWidth)}
                aria-label="Grubość obwódki"
                disabled={locked}
                className="mt-1 w-full accent-kobalt"
                onChange={(event) => onStrokeWidth(Number(event.target.value))}
              />
            </Section>
          ) : null}

          {shapeSelected ? (
            <Section title="Kolor figury">
              <div className="flex flex-wrap gap-1">
                {inks.map((ink) => (
                  <Swatch key={`shape-${ink.id}`} label={ink.label} value={ink.value} selected={fill?.toLowerCase() === ink.value} onClick={() => onFill(ink.value)} />
                ))}
              </div>
            </Section>
          ) : null}

          {imageSelected ? (
            <Section title="Zdjęcie">
              <ToolButton label="Na strefę" disabled={locked} onClick={onFit}>
                <FitIcon />
              </ToolButton>
              <div className="mt-1.5 grid gap-1">
                <CropSlider label="Z lewej" value={crop.left} disabled={locked} onChange={(left) => onCrop({ ...crop, left })} />
                <CropSlider label="Z prawej" value={crop.right} disabled={locked} onChange={(right) => onCrop({ ...crop, right })} />
                <CropSlider label="Z góry" value={crop.top} disabled={locked} onChange={(top) => onCrop({ ...crop, top })} />
                <CropSlider label="Z dołu" value={crop.bottom} disabled={locked} onChange={(bottom) => onCrop({ ...crop, bottom })} />
              </div>
              <button type="button" className="mt-1 text-xs text-muted underline-offset-2 hover:underline" disabled={locked} onClick={onResetCrop}>
                Resetuj kadr
              </button>
            </Section>
          ) : null}

          {issues.length > 0 ? (
            <ul className="grid gap-0.5 px-2 py-2 text-xs text-muted" role="status">
              {issues.map((issue) => (
                <li key={`${issue.areaId}-${issue.code}`}>{issue.message}</li>
              ))}
            </ul>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-1 border-b border-line px-2 py-2 last:border-b-0">
      <h3 className="text-[11px] font-semibold tracking-wide text-muted">{title}</h3>
      <div>{children}</div>
    </section>
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
    <label className="grid grid-cols-[3.5rem_1fr_1.5rem] items-center gap-1 text-xs">
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
