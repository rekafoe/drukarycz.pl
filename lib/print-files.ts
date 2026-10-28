import { mkdirSync, rmSync, statSync, writeFileSync } from "fs";
import path from "path";
import type { PrintAreaId, PrintFileMeta, PrintFiles } from "@/lib/work";

const AREAS: readonly PrintAreaId[] = ["front", "back", "wrap"];
const SAFE_ID = /^[A-Za-z0-9_-]{8,32}$/;

function printsDir(sessionId: string) {
  if (!SAFE_ID.test(sessionId)) return null;
  return path.join(process.cwd(), "data", "prints", sessionId);
}

export function listPrintFiles(sessionId: string): PrintFiles {
  const dir = printsDir(sessionId);
  if (!dir) return {};
  const files: PrintFiles = {};
  for (const area of AREAS) {
    try {
      const info = statSync(path.join(dir, `${area}.png`));
      if (!info.isFile() || info.size <= 0) continue;
      files[area] = { bytes: info.size, savedAt: new Date(info.mtimeMs).toISOString() };
    } catch {
      // файла этой зоны нет
    }
  }
  return files;
}

export function writePrintFile(sessionId: string, area: PrintAreaId, bytes: Buffer): PrintFileMeta {
  const dir = printsDir(sessionId);
  if (!dir) throw new Error("bad session");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${area}.png`);
  writeFileSync(file, bytes);
  const info = statSync(file);
  return { bytes: info.size, savedAt: new Date(info.mtimeMs).toISOString() };
}

export function removePrints(sessionId: string) {
  const dir = printsDir(sessionId);
  if (!dir) return;
  rmSync(dir, { recursive: true, force: true });
}
