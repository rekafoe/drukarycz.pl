import { editorPaths } from "@/lib/catalog";
import { requireSessionId } from "@/lib/session";
import { replaceWork } from "@/lib/store";
import { workForOwn } from "@/lib/wzory/choose";
import { productFromSlug } from "@/lib/wzory/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** «Zrób własny» со страниц витрины: редактор этой вещи без wzoru. */
export async function POST(request: Request) {
  let product = null;
  try {
    product = productFromSlug(((await request.json()) as { produkt?: unknown }).produkt);
  } catch {
    product = null;
  }
  if (!product) return Response.json({ error: "Nieznany produkt" }, { status: 400 });
  const sessionId = await requireSessionId();
  const chosen = product;
  const view = await replaceWork(sessionId, (work) => workForOwn(work, chosen));
  if (!view) return Response.json({ error: "Nie znaleziono sesji" }, { status: 401 });
  return Response.json({ ok: true, path: editorPaths[chosen] });
}
