"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoginPanel } from "@/components/login-panel";
import { PosterHeader } from "@/components/poster-chrome";
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
    <main className="min-h-screen bg-[#F3EEE4]">
      <PosterHeader current="home" />
      <div className="mx-auto grid max-w-lg content-center gap-4 px-6 py-16">
      {phase === "opening" ? <p className="text-muted">Otwieramy projekt…</p> : null}
      {phase === "denied" ? (
        <>
          <h1 className="font-poster text-[40px] leading-[0.95] font-black tracking-tight">Projekt się nie otwiera</h1>
          <p className="text-muted">Otwiera się tylko własny projekt.</p>
          <Link href="/" className="font-extrabold text-(--a-mark)">
            Do drzwi
          </Link>
        </>
      ) : null}
      {phase === "locked" ? (
        <>
          <h1 className="font-poster text-[40px] leading-[0.95] font-black tracking-tight">Projekt się nie otwiera</h1>
          <p className="text-muted">Zaloguj się telefonem, na który jest zapisany.</p>
          <Link href="/" className="font-extrabold text-(--a-mark)">
            Do drzwi
          </Link>
          <LoginPanel
            embedded
            onSuccess={() => {
              setPhase("opening");
              void tryOpen();
            }}
          />
        </>
      ) : null}
      </div>
    </main>
  );
}
