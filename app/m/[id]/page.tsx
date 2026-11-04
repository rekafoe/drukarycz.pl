import type { Metadata } from "next";
import { DesignGate } from "@/components/design-gate";
import { seller } from "@/lib/seller";

export const metadata: Metadata = {
  title: `Twój projekt — ${seller.brand}`,
  robots: { index: false, follow: false },
};

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DesignGate id={id} />;
}
