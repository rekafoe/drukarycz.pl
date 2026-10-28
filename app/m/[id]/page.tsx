import { DesignGate } from "@/components/design-gate";

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DesignGate id={id} />;
}
