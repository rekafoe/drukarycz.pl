export function EditorLoader({
  failed = false,
  onLeave,
}: {
  failed?: boolean;
  onLeave?: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-paper px-6 text-center" role="status">
      <div className="grid max-w-sm justify-items-center gap-4">
        {failed ? null : (
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-(--a-mark)" aria-hidden="true" />
        )}
        <p className="text-sm text-muted">
          {failed ? "Nie udało się otworzyć edytora." : "Otwieramy edytor…"}
        </p>
        {onLeave ? (
          <button type="button" className="text-sm font-semibold text-muted" onClick={onLeave}>
            Do rzeczy
          </button>
        ) : null}
      </div>
    </div>
  );
}
