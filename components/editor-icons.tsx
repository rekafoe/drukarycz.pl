import type { ReactNode } from "react";

/** Иконки нарисованы здесь. Внешних адресов, шрифтов и CDN нет. */

type IconProps = { className?: string };

function Glyph({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-5 w-5"}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function TextIcon() {
  return (
    <Glyph>
      <path d="M5 6h14" />
      <path d="M12 6v12" />
      <path d="M8 18h8" />
    </Glyph>
  );
}

export function PhotoIcon() {
  return (
    <Glyph>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.3" />
      <path d="m4 16 4.2-3.2 3 2.4 2.4-1.8L20 17" />
    </Glyph>
  );
}

export function UndoIcon() {
  return (
    <Glyph>
      <path d="M8 8 4 12l4 4" />
      <path d="M4 12h10a5 5 0 1 1 0 10h-3" />
    </Glyph>
  );
}

export function RedoIcon() {
  return (
    <Glyph>
      <path d="m16 8 4 4-4 4" />
      <path d="M20 12H10a5 5 0 1 0 0 10h3" />
    </Glyph>
  );
}

export function CenterIcon() {
  return (
    <Glyph>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </Glyph>
  );
}

export function RotateIcon() {
  return (
    <Glyph>
      <path d="M19 12a7 7 0 1 1-2-4.9" />
      <path d="M19 4v5h-5" />
    </Glyph>
  );
}

export function DuplicateIcon() {
  return (
    <Glyph>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
    </Glyph>
  );
}

export function LargerIcon() {
  return (
    <Glyph>
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </Glyph>
  );
}

export function SmallerIcon() {
  return (
    <Glyph>
      <path d="M6 12h12" />
    </Glyph>
  );
}

export function ForwardIcon() {
  return (
    <Glyph>
      <path d="M12 19V7" />
      <path d="m7 11 5-5 5 5" />
    </Glyph>
  );
}

export function BackwardIcon() {
  return (
    <Glyph>
      <path d="M12 5v12" />
      <path d="m7 13 5 5 5-5" />
    </Glyph>
  );
}

export function TrashIcon() {
  return (
    <Glyph>
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="m7 7 1 13h8l1-13" />
    </Glyph>
  );
}
