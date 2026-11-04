import { useEffect, useState } from "react";
import type { WzorFont } from "@/lib/wzory/types";

const loaded = new Map<string, Promise<void>>();

/** Fabric меряет текст при loadFromJSON, поэтому шрифт должен быть в document.fonts до открытия листа. */
export function loadWzorFonts(fonts: readonly WzorFont[]) {
  return Promise.all(
    fonts.map((font) => {
      const key = `${font.family}|${font.url}`;
      let job = loaded.get(key);
      if (!job) {
        const face = new FontFace(font.family, `url(${JSON.stringify(font.url)})`);
        job = face
          .load()
          .then((ready) => {
            document.fonts.add(ready);
          })
          .catch(() => {
            loaded.delete(key);
          });
        loaded.set(key, job);
      }
      return job;
    }),
  ).then(() => undefined);
}

export function useWzorFonts(fonts: readonly WzorFont[] | undefined) {
  const key = fonts?.length ? JSON.stringify(fonts.map((font) => ({ family: font.family, url: font.url }))) : "";
  const [readyKey, setReadyKey] = useState("");
  useEffect(() => {
    if (!key) return;
    let cancel = false;
    void loadWzorFonts(JSON.parse(key) as WzorFont[]).then(() => {
      if (!cancel) setReadyKey(key);
    });
    return () => {
      cancel = true;
    };
  }, [key]);
  return !key || readyKey === key;
}
