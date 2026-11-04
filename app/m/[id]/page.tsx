import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignGate } from "@/components/design-gate";
import { seller } from "@/lib/seller";

export const metadata: Metadata = {
  title: `Twój projekt — ${seller.brand}`,
  robots: { index: false, follow: false },
};

/** id макета — newId() из lib/store.ts: 9 байт в base64url. */
const designId = /^[A-Za-z0-9_-]{12}$/;

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!designId.test(id)) notFound();
  return <DesignGate id={id} />;
}
