import { MerchFlow } from "@/components/merch-flow";
import type { ProductId } from "@/lib/catalog";
import { peekCurrentSession } from "@/lib/session";
import { openEditor } from "@/lib/work";
import { dropForeignDesign } from "@/lib/wzory/choose";

/** Лист по адресу вещи. SEO-лавка этот компонент не монтирует. Параметры адреса не читаем. */
export async function ProductEditorPage({ product }: { product: ProductId }) {
  const view = await peekCurrentSession();
  return (
    <MerchFlow surface="editor" initial={{ ...view, work: dropForeignDesign(openEditor(view.work, product)) }} />
  );
}
