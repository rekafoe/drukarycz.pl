import type { WorkSnapshot } from "@/lib/work";
import { designOrderParams } from "@/lib/wzory/choose";
import { feeLabel, formatZl, wzorTitle } from "@/lib/wzory/labels";

/** Подпись позиции: «Wzór nr 000123» или «Własny projekt». */
export function CartWzorLine({ work }: { work: WorkSnapshot }) {
  const params = designOrderParams(work);
  if (work.design) {
    return (
      <>
        <p className="text-sm font-semibold text-ink">
          {wzorTitle(work.design.code)} · {params.designModified ? "zmieniony w edytorze" : "bez zmian"}
        </p>
        <p className="text-sm text-muted">
          {work.design.usageFee > 0 ? `${feeLabel(work.design.usageFee)}, raz na pozycję` : feeLabel(0)}
        </p>
      </>
    );
  }
  return (
    <p className="text-sm text-muted">
      {params.usedPrintAreaIds.length > 0 || work.previewUrl ? "Własny projekt" : "Arkusz jest jeszcze pusty"}
    </p>
  );
}

export function WzorOrderFields({ work }: { work: WorkSnapshot }) {
  const params = designOrderParams(work);
  return (
    <>
      <li>designTemplateId: {params.designTemplateId ?? "—"}</li>
      <li>designTemplateCode: {params.designTemplateCode ?? "—"}</li>
      <li>designUsageFee: {formatZl(params.designUsageFee)}</li>
      <li>designModified: {params.designModified ? "tak" : "nie"}</li>
      <li>usedPrintAreaIds: {params.usedPrintAreaIds.length > 0 ? params.usedPrintAreaIds.join(", ") : "—"}</li>
    </>
  );
}
