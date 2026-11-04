"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowIcon, coralButton } from "@/components/brand";
import { LoginPanel } from "@/components/login-panel";
import { SiteHeader } from "@/components/site-header";
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
    <main className="halftone-ink min-h-dvh bg-cream text-poster">
      <SiteHeader />
      <div className="mx-auto grid max-w-lg content-center gap-4 px-5 py-12 md:py-20">
        {phase === "opening" ? (
          <div className="grid justify-items-center gap-4 py-16 text-center" role="status">
            <span className="relative h-1 w-40 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <span className="boot-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-coral" />
            </span>
            <p className="text-muted">Otwieramy projekt…</p>
          </div>
        ) : null}
        {phase === "denied" ? (
          <>
            <h1 className="font-display text-[34px] leading-[1.02] font-extrabold tracking-[-0.03em] md:text-[44px]">
              Projekt się nie otwiera
            </h1>
            <p className="text-muted">Otwiera się tylko własny projekt.</p>
            <Link href="/" className={`${coralButton} w-fit px-5 py-3`}>
              Zrób własny
              <ArrowIcon />
            </Link>
          </>
        ) : null}
        {phase === "locked" ? (
          <>
            <h1 className="font-display text-[34px] leading-[1.02] font-extrabold tracking-[-0.03em] md:text-[44px]">
              Projekt się nie otwiera
            </h1>
            <p className="text-muted">Zaloguj się telefonem, na który jest zapisany.</p>
            <LoginPanel
              embedded
              onSuccess={() => {
                setPhase("opening");
                void tryOpen();
              }}
            />
            <Link href="/" className="text-sm font-semibold text-muted hover:text-poster">
              ← Wróć do sklepu
            </Link>
          </>
        ) : null}
      </div>
    </main>
  );
}
