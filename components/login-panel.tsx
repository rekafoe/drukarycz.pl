"use client";

import { useState, type FormEvent } from "react";
import type { SessionView } from "@/lib/work";

export function LoginPanel({
  onClose,
  onSuccess,
  embedded = false,
}: {
  onClose?: () => void;
  onSuccess: (session: SessionView) => void;
  embedded?: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [needsName, setNeedsName] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestCode() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await response.json()) as { error?: string; devCode?: string | null; needsName?: boolean };
      if (!response.ok) {
        setError(data.error ?? "Не удалось выдать код");
        setDevCode(null);
        return;
      }
      setDevCode(data.devCode ?? null);
      const askName = data.needsName !== false;
      setNeedsName(askName);
      if (!askName) setName("");
    } catch {
      setError("Не удалось выдать код");
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
        body: JSON.stringify({ phone, code, name }),
      });
      const data = (await response.json()) as SessionView & { error?: string };
      if (!response.ok || !data.user) {
        setError(data.error ?? "Код не подошёл");
        return;
      }
      onSuccess(data);
    } catch {
      setError("Не удалось войти");
    } finally {
      setBusy(false);
    }
  }

  const form = (
      <form onSubmit={verify} className="grid w-full max-w-md gap-3 rounded-2xl bg-paper p-6 text-ink">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-extrabold tracking-tight">Вход по телефону</h2>
          {onClose ? (
            <button type="button" className="text-sm text-muted" onClick={onClose}>
              Закрыть
            </button>
          ) : null}
        </div>
        <p className="text-sm text-muted">SMS не отправляем. В этом прототипе код виден на экране.</p>
        <label className="grid gap-1 text-sm font-bold">
          Телефон
          <input
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+375"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium placeholder:text-muted"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          className="rounded-xl border border-ink px-4 py-3 font-bold"
          onClick={() => void requestCode()}
        >
          Получить код
        </button>
        {devCode ? (
          <p className="rounded-xl border border-line bg-card px-3 py-3 text-sm">
            Тестовый код: <span className="font-extrabold tracking-[0.2em]">{devCode}</span>
          </p>
        ) : null}
        <label className="grid gap-1 text-sm font-bold">
          Код
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
            Имя
            <input
              required
              autoComplete="name"
              placeholder="Как к вам обращаться"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-medium placeholder:text-muted"
            />
          </label>
        ) : null}
        {error ? <p className="text-sm font-semibold">{error}</p> : null}
        <button type="submit" disabled={busy} className="rounded-xl bg-ink px-4 py-4 font-bold text-white">
          Войти
        </button>
      </form>
  );

  if (embedded) return form;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#1a1916]/40 px-4">{form}</div>;
}
