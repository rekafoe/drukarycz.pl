import type { ReactNode } from "react";

/** Иконки нарисованы здесь. Внешних адресов, шрифтов и CDN нет. */

type IconProps = { className?: string };

function Glyph({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-4 w-4"}
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

export function AlignLeftIcon() {
  return (
    <Glyph>
      <path d="M5 5v14" />
      <path d="M9 8h10" />
      <path d="M9 12h6" />
      <path d="M9 16h10" />
    </Glyph>
  );
}

export function AlignCenterIcon() {
  return (
    <Glyph>
      <path d="M12 5v14" />
      <path d="M7 8h10" />
      <path d="M9 12h6" />
      <path d="M7 16h10" />
    </Glyph>
  );
}

export function AlignRightIcon() {
  return (
    <Glyph>
      <path d="M19 5v14" />
      <path d="M5 8h10" />
      <path d="M9 12h6" />
      <path d="M5 16h10" />
    </Glyph>
  );
}

export function FitIcon() {
  return (
    <Glyph>
      <path d="M4 9V4h5" />
      <path d="M15 4h5v5" />
      <path d="M20 15v5h-5" />
      <path d="M9 20H4v-5" />
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

export function BoldIcon() {
  return (
    <Glyph>
      <path d="M7 19V5h6.2a3.4 3.4 0 0 1 0 6.8H7" />
      <path d="M7 11.8h7.2a3.6 3.6 0 0 1 0 7.2H7" />
    </Glyph>
  );
}

export function ItalicIcon() {
  return (
    <Glyph>
      <path d="M14 5H9" />
      <path d="m10 19 4-14" />
      <path d="M8 19h6" />
    </Glyph>
  );
}

export function SpacingIcon() {
  return (
    <Glyph>
      <path d="M4 7v10" />
      <path d="M20 7v10" />
      <path d="M8 12h8" />
      <path d="m10 9-2 3 2 3" />
      <path d="m14 9 2 3-2 3" />
    </Glyph>
  );
}

export function StrokeIcon() {
  return (
    <Glyph>
      <path d="M8 17 16 7" />
      <circle cx="8" cy="17" r="2.2" />
      <circle cx="16" cy="7" r="2.2" />
    </Glyph>
  );
}

export function RectIcon() {
  return (
    <Glyph>
      <rect x="5" y="7" width="14" height="10" rx="1.5" />
    </Glyph>
  );
}

export function CircleIcon() {
  return (
    <Glyph>
      <circle cx="12" cy="12" r="6.5" />
    </Glyph>
  );
}

export function TriangleIcon() {
  return (
    <Glyph>
      <path d="M12 5 20 19H4Z" />
    </Glyph>
  );
}

export function LineIcon() {
  return (
    <Glyph>
      <path d="M5 16 19 8" />
    </Glyph>
  );
}

export function FlipHIcon() {
  return (
    <Glyph>
      <path d="M12 4v16" />
      <path d="M8 8 4 12l4 4" />
      <path d="m16 8 4 4-4 4" />
    </Glyph>
  );
}

export function FlipVIcon() {
  return (
    <Glyph>
      <path d="M4 12h16" />
      <path d="m8 8 4-4 4 4" />
      <path d="m8 16 4 4 4-4" />
    </Glyph>
  );
}

export function LockIcon() {
  return (
    <Glyph>
      <rect x="6" y="11" width="12" height="8" rx="1.5" />
      <path d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11" />
    </Glyph>
  );
}

export function UnlockIcon() {
  return (
    <Glyph>
      <rect x="6" y="11" width="12" height="8" rx="1.5" />
      <path d="M8.5 11V8.5a3.5 3.5 0 0 1 6.2-2" />
    </Glyph>
  );
}

export function EyeIcon() {
  return (
    <Glyph>
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.2" />
    </Glyph>
  );
}

export function EyeOffIcon() {
  return (
    <Glyph>
      <path d="M4 5 20 19" />
      <path d="M9.5 6.4A9 9 0 0 1 12 6c5.5 0 9 6 9 6a16 16 0 0 1-3.1 3.6" />
      <path d="M6.2 8.2C4.2 9.8 3 12 3 12s3.5 6 9 6a8 8 0 0 0 3-.6" />
    </Glyph>
  );
}

export function AlignTopIcon() {
  return (
    <Glyph>
      <path d="M5 5h14" />
      <path d="M8 9h8" />
      <path d="M10 13h4" />
      <path d="M8 17h8" />
    </Glyph>
  );
}

export function AlignMiddleIcon() {
  return (
    <Glyph>
      <path d="M4 12h16" />
      <path d="M8 8h8" />
      <path d="M8 16h8" />
    </Glyph>
  );
}

export function AlignBottomIcon() {
  return (
    <Glyph>
      <path d="M5 19h14" />
      <path d="M8 15h8" />
      <path d="M10 11h4" />
      <path d="M8 7h8" />
    </Glyph>
  );
}

export function ShapesIcon() {
  return (
    <Glyph>
      <rect x="4" y="4" width="7.5" height="7.5" rx="1" />
      <circle cx="16.5" cy="7.8" r="3.3" />
      <path d="M8.2 20 4.2 13.5h8Z" />
    </Glyph>
  );
}

export function StickersIcon() {
  return (
    <Glyph>
      <path d="M12 4 14.2 9.4 20 10.1 15.8 14 17 19.8 12 16.8 7 19.8 8.2 14 4 10.1 9.8 9.4Z" />
    </Glyph>
  );
}

export function LayersIcon() {
  return (
    <Glyph>
      <path d="M12 4 4 8.2 12 12.4 20 8.2 12 4Z" />
      <path d="m4 12 8 4.2L20 12" />
      <path d="m4 15.8 8 4.2 8-4.2" />
    </Glyph>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <Glyph className={className ?? "h-3 w-3"}>
      <path d="m6 9 6 6 6-6" />
    </Glyph>
  );
}

export function CropIcon() {
  return (
    <Glyph>
      <path d="M7 3v12a2 2 0 0 0 2 2h12" />
      <path d="M3 8h12a2 2 0 0 1 2 2v11" />
    </Glyph>
  );
}
