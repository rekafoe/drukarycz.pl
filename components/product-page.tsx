import { JsonLd } from "@/components/json-ld";
import { MerchFlow } from "@/components/merch-flow";
import type { ProductId } from "@/lib/catalog";
import { productJsonLd } from "@/lib/seo";
import { peekCurrentSession } from "@/lib/session";
import { openShop } from "@/lib/work";

/** Лавка вещи по своему адресу: поисковик и человек без печенья сразу видят товар и цену. */
export async function ProductPage({ product }: { product: ProductId }) {
  const view = await peekCurrentSession();
  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <MerchFlow initial={{ ...view, work: openShop(view.work, product) }} />
    </>
  );
}
