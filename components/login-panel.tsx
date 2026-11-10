"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AuthMethods } from "@/lib/auth/methods";
import type { SessionView } from "@/lib/work";

export function LoginPanel({
  onClose,
  onSuccess,
  embedded = false,
  initialError = null,
}: {
  onClose?: () => void;
  onSuccess: (session: SessionView) => void;
  embedded?: boolean;
  initialError?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<"crm" | "mock" | null>(null);
  const [needsName, setNeedsName] = useState(true);
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);
  const [google, setGoogle] = useState<AuthMethods["google"]>(
    process.env.NODE_ENV === "production" ? "off" : "mock",
  );

  useEffect(() => {
    let cancel = false;
    void fetch("/api/auth/methods")
      .then((response) => response.json())
      .then((data: Partial<AuthMethods>) => {
        if (!cancel && (data.google === "live" || data.google === "mock" || data.google === "off")) {
          setGoogle(data.google);
        }
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, []);

  async function requestCode() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as {
        error?: string;
        devCode?: string | null;
        needsName?: boolean;
        delivery?: "crm" | "mock";
      };
      if (!response.ok) {
        setError(data.error ?? "Nie udało się wysłać kodu");
        setDevCode(null);
        setDelivery(null);
        return;
      }
      setDevCode(data.devCode ?? null);
      setDelivery(data.delivery === "crm" ? "crm" : "mock");
      const askName = data.needsName !== false;
      setNeedsName(askName);
      if (!askName) setName("");
    } catch {
      setError("Nie udało się wysłać kodu");
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, name }),
      });
      const data = (await response.json()) as SessionView & { error?: string };
      if (!response.ok || !data.user) {
        setError(data.error ?? "Kod nie pasuje");
        return;
      }
      onSuccess(data);
    } catch {
      setError("Nie udało się wejść");
    } finally {
      setBusy(false);
    }
  }

  async function mockGoogle() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/google/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as SessionView & { error?: string };
      if (!response.ok || !data.user) {
        setError(data.error ?? "Nie udało się wejść przez Google");
        return;
      }
      onSuccess(data);
    } catch {
      setError("Nie udało się wejść przez Google");
    } finally {
      setBusy(false);
    }
  }

  const form = (
    <form
      onSubmit={verify}
      className="font-ui grid w-full max-w-md gap-3 rounded-3xl bg-[#F3EEE4] p-6 text-ink shadow-[0_24px_60px_-28px_rgba(22,19,15,0.45)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-poster text-[28px] leading-none font-black tracking-tight">Logowanie</h2>
        {onClose ? (
          <button type="button" className="text-sm text-muted" onClick={onClose}>
            Zamknij
          </button>
        ) : null}
      </div>
      <p className="text-sm text-muted">
        Kod przychodzi e-mailem. SMS-ów nie wysyłamy. Wejście przez Google jest tylko do konta — bez czcionek Google.
      </p>
      <label className="grid gap-1 text-sm font-bold">
        E-mail
        <input
          required
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="anna@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium placeholder:text-muted"
        />
      </label>
      <button type="button" disabled={busy} className="btn-ghost" onClick={() => void requestCode()}>
        Wyślij kod
      </button>
      {delivery === "crm" ? (
        <p className="rounded-xl border border-line bg-card px-3 py-3 text-sm">
          Kod wysłaliśmy na {email}. To nie jest marketing.
        </p>
      ) : null}
      {delivery === "mock" && !devCode ? (
        <p className="rounded-xl border border-line bg-card px-3 py-3 text-sm">
          Poczta CRM nie jest podłączona. Na produkcji kod z listu, tutaj tryb testowy.
        </p>
      ) : null}
      {devCode ? (
        <p className="rounded-xl border border-line bg-card px-3 py-3 text-sm">
          Kod testowy: <span className="font-extrabold tracking-[0.2em]">{devCode}</span>
          <span className="mt-1 block text-muted">CRM / SMTP niepodłączone — list nie poszedł.</span>
        </p>
      ) : null}
      <label className="grid gap-1 text-sm font-bold">
        Kod
        <input
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium tracking-[0.2em]"
        />
      </label>
      {needsName ? (
        <label className="grid gap-1 text-sm font-bold">
          Imię
          <input
            required
            autoComplete="name"
            placeholder="Jak się do Ciebie zwracać"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium placeholder:text-muted"
          />
        </label>
      ) : null}
      {error ? <p className="text-sm font-semibold">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn-kobalt w-full py-4">
        Wejdź
      </button>

      {google !== "off" ? (
        <>
          <div className="flex items-center gap-3 text-xs font-bold tracking-wide text-muted uppercase">
            <span className="h-px flex-1 bg-line" />
            albo
            <span className="h-px flex-1 bg-line" />
          </div>
          {google === "live" ? (
            <a href="/api/auth/google" className="btn-ghost w-full gap-2 py-3">
              <GoogleMark />
              Wejdź przez Google
            </a>
          ) : (
            <button type="button" disabled={busy} className="btn-ghost w-full gap-2 py-3" onClick={() => void mockGoogle()}>
              <GoogleMark />
              Wejdź przez Google (tryb testowy)
            </button>
          )}
        </>
      ) : (
        <p className="text-sm text-muted">Wejście przez Google włączymy, gdy sprzedawca je podłączy.</p>
      )}
    </form>
  );

  if (embedded) return form;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#16130F]/55 px-4">{form}</div>;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
