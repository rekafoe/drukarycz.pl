import type { NextRequest } from "next/server";
import { wzoryMessages } from "@/lib/wzory/labels";
import { listWzory } from "@/lib/wzory/service";
import { productFromSlug } from "@/lib/wzory/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const product = productFromSlug(params.get("produkt"));
  if (!product) return Response.json({ error: "Nieznany produkt" }, { status: 400 });
  const category = Number(params.get("kategoria"));
  try {
    const items = await listWzory(product);
    const filtered = Number.isInteger(category) && category > 0 ? items.filter((item) => item.categoryId === category) : items;
    return Response.json({ items: filtered }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (error) {
    console.error("[wzory] список не собран", error);
    return Response.json({ error: wzoryMessages.listError }, { status: 502 });
  }
}
