import { clearPrints, saveAreaPrint } from "@/lib/store";
import { requireSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 8_000_000;

function pngMagic(bytes: Buffer) {
  return (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

export async function POST(request: Request) {
  const sessionId = await requireSessionId();
  const area = new URL(request.url).searchParams.get("area") ?? "";
  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_BYTES || !pngMagic(bytes)) {
    return Response.json({ error: "Plik do druku jest za duży albo nie jest PNG" }, { status: 400 });
  }
  const saved = await saveAreaPrint(sessionId, area, bytes);
  if ("error" in saved) return Response.json({ error: saved.error }, { status: 400 });
  return Response.json({ area, file: saved.file });
}

export async function DELETE() {
  const sessionId = await requireSessionId();
  const view = await clearPrints(sessionId);
  if (!view) return Response.json({ error: "Nie znaleziono sesji" }, { status: 401 });
  return Response.json({ ok: true });
}
