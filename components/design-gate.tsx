"use client";

import { useEffect, useState } from "react";
import { LoginPanel } from "@/components/login-panel";
import type { SessionView } from "@/lib/work";

export function DesignGate({ id }: { id: string }) {
  const [phase, setPhase] = useState<"opening" | "locked" | "denied">("opening");

  async function tryOpen() {
    const response = await fetch(`/api/designs/${id}/open`, { method: "POST" });
    if (response.ok) {
      window.location.assign("/");
      return;
    }
    const session = (await fetch("/api/session").then((item) => item.json())) as SessionView;
    setPhase(session.user ? "denied" : "locked");
  }

  useEffect(() => {
    let cancel = false;
    void (async () => {
      const response = await fetch(`/api/designs/${id}/open`, { method: "POST" });
      if (cancel) return;
      if (response.ok) {
        window.location.assign("/");
        return;
      }
      const session = (await fetch("/api/session").then((item) => item.json())) as SessionView;
      if (!cancel) setPhase(session.user ? "denied" : "locked");
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  return (
    <main className="mx-auto grid min-h-screen max-w-lg content-center gap-4 px-6">
      {phase === "opening" ? <p className="text-muted">Otwieramy projekt…</p> : null}
      {phase === "denied" ? (
        <>
          <h1 className="text-4xl font-extrabold tracking-tight">Projekt się nie otwiera</h1>
          <p className="text-muted">Otwiera się tylko własny projekt.</p>
          <a href="/" className="font-bold">
            Do drzwi
          </a>
        </>
      ) : null}
      {phase === "locked" ? (
        <>
          <h1 className="text-4xl font-extrabold tracking-tight">Projekt się nie otwiera</h1>
          <p className="text-muted">Zaloguj się telefonem, na który jest zapisany.</p>
          <a href="/" className="font-bold">
            Do drzwi
          </a>
          <LoginPanel
            embedded
            onSuccess={() => {
              setPhase("opening");
              void tryOpen();
            }}
          />
        </>
      ) : null}
    </main>
  );
}
