import { pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let relative = specifier.slice(2);
    if (!relative.endsWith(".ts") && !relative.endsWith(".tsx")) relative += ".ts";
    const file = new URL(`../${relative}`, import.meta.url);
    return nextResolve(file.href, context);
  }
  return nextResolve(specifier, context);
}
