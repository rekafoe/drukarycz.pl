import { useEffect, useState } from "react";
import type { SessionView } from "@/lib/work";

/** Мокап в цвете, выбранном на лавке. */
export function useSessionColor(fallback = "#171614") {
  const [color, setColor] = useState(fallback);
  useEffect(() => {
    let cancel = false;
    fetch("/api/session")
      .then((response) => (response.ok ? (response.json() as Promise<SessionView>) : null))
      .then((view) => {
        if (!cancel && view?.work.color) setColor(view.work.color);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, []);
  return color;
}

export async function startOwnDesign(product: "koszulka" | "kubek", go: (href: string) => void) {
  const response = await fetch("/api/wzory/wlasny", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ produkt: product }),
  });
  if (response.ok) go("/");
  return response.ok;
}
