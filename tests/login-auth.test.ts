import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { canSendAuthMail, sendLoginCodeViaCrm } from "../lib/auth/crm-mail.ts";
import { isEmail, normalizeEmail } from "../lib/auth/email.ts";
import { googleSignInMode, isGoogleConfigured, safeReturnTo } from "../lib/auth/google.ts";
import { authMethods } from "../lib/auth/methods.ts";
import { ensureSession, loginGoogleProfile, requestCode, verifyCode } from "../lib/store.ts";

test.describe("logowanie e-mail i Google", { concurrency: false }, () => {

function withEnv(pairs: Record<string, string | undefined>, run: () => void | Promise<void>) {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(pairs)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return Promise.resolve()
    .then(run)
    .finally(() => {
      for (const [key, value] of previous) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });
}

test("e-mail normalizuje i odrzuca śmieci", () => {
  assert.equal(normalizeEmail("  Anna@Example.COM "), "anna@example.com");
  assert.equal(isEmail("anna@example.com"), true);
  assert.equal(isEmail("nie"), false);
  assert.equal(isEmail(""), false);
});

test("bez CRM i Google metody są mockiem", () =>
  withEnv(
    {
      CRM_URL: undefined,
      CRM_API_URL: undefined,
      AUTH_MAIL_API_KEY: undefined,
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      NODE_ENV: "development",
    },
    () => {
      assert.equal(canSendAuthMail(), false);
      assert.equal(isGoogleConfigured(), false);
      assert.equal(googleSignInMode(), "mock");
      const methods = authMethods();
      assert.equal(methods.mail, "mock");
      assert.equal(methods.google, "mock");
    },
  ));

test("w production bez Google przycisk jest wyłączony", () =>
  withEnv(
    {
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      NODE_ENV: "production",
    },
    () => {
      assert.equal(googleSignInMode(), "off");
    },
  ));

test("CRM mail: unset nie woła sieci", async () => {
  const originalFetch = globalThis.fetch;
  let called = 0;
  globalThis.fetch = (async () => {
    called += 1;
    return new Response("no", { status: 500 });
  }) as typeof fetch;
  try {
    await withEnv({ CRM_URL: undefined, AUTH_MAIL_API_KEY: undefined }, async () => {
      const result = await sendLoginCodeViaCrm({
        to: "anna@example.com",
        code: "1234",
        idempotencyKey: "login:test:1",
      });
      assert.equal(result.mode, "mock");
      assert.equal(result.sent, false);
      assert.equal(result.reason, "unset");
      assert.equal(called, 0);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("CRM mail: 202 to żywy list", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; key: string | null; body: unknown }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({ url, key: headers.get("X-API-Key"), body: JSON.parse(String(init?.body ?? "{}")) });
    return new Response("{}", { status: 202 });
  }) as typeof fetch;
  try {
    await withEnv(
      { CRM_URL: "https://crm.example.com", AUTH_MAIL_API_KEY: "mail-secret" },
      async () => {
        const result = await sendLoginCodeViaCrm({
          to: "anna@example.com",
          code: "4821",
          idempotencyKey: "login:sess:abc",
        });
        assert.equal(result.sent, true);
        assert.equal(result.mode, "crm");
        assert.equal(calls.length, 1);
        assert.equal(calls[0].url, "https://crm.example.com/api/mail/website/login-code");
        assert.equal(calls[0].key, "mail-secret");
        assert.deepEqual(calls[0].body, {
          to: "anna@example.com",
          code: "4821",
          locale: "pl",
          brand: "drukarycz.pl",
          idempotencyKey: "login:sess:abc",
        });
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("safeReturnTo nie puszcza /api", () => {
  const request = new Request("http://127.0.0.1:43141/api/auth/google?next=/koszulka");
  assert.equal(safeReturnTo(request), "/koszulka");
  const evil = new Request("http://127.0.0.1:43141/api/auth/google?next=//evil.example");
  assert.equal(safeReturnTo(evil), "/");
  const api = new Request("http://127.0.0.1:43141/api/auth/google?next=/api/auth/logout");
  assert.equal(safeReturnTo(api), "/");
});

test("kod e-mail i Google logują do tej samej sesji", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "drukarycz-login-"));
  const previousStore = process.env.MERCH_STORE;
  process.env.MERCH_STORE = path.join(dir, "store.json");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response("no", { status: 503 })) as typeof fetch;
  try {
    const session = await ensureSession(null);
    const asked = await requestCode(session.id, "Anna@Example.com");
    assert.equal("error" in asked, false);
    if ("error" in asked) return;
    assert.equal(asked.delivery, "mock");
    assert.equal(typeof asked.devCode, "string");
    assert.equal(asked.devCode?.length, 4);

    const verified = await verifyCode(session.id, "anna@example.com", asked.devCode ?? "", "Anna");
    assert.equal("error" in verified, false);
    if ("error" in verified) return;
    assert.equal(verified.view.user?.email, "anna@example.com");
    assert.equal(verified.view.user?.name, "Anna");
    assert.equal(verified.view.user?.phone, "");
    assert.equal(verified.view.work.order.email, "anna@example.com");
    assert.equal(verified.view.devCode, null);

    const google = await loginGoogleProfile(session.id, {
      googleId: "sub-1",
      email: "anna@example.com",
      name: "Anna G",
    });
    assert.equal("error" in google, false);
    if ("error" in google) return;
    assert.equal(google.view.user?.id, verified.view.user?.id);
    assert.equal(google.view.user?.name, "Anna G");
  } finally {
    globalThis.fetch = originalFetch;
    if (previousStore === undefined) delete process.env.MERCH_STORE;
    else process.env.MERCH_STORE = previousStore;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("panel i README: e-mail, Google, bez SMS i bez czcionek Google", () => {
  const panel = fs.readFileSync("components/login-panel.tsx", "utf8");
  const readme = fs.readFileSync("README.md", "utf8");
  const legal = fs.readFileSync("components/legal-documents.tsx", "utf8");
  const google = fs.readFileSync("lib/auth/google.ts", "utf8");
  const mail = fs.readFileSync("lib/auth/crm-mail.ts", "utf8");
  assert.match(panel, /Wejdź przez Google/);
  assert.match(panel, /Wyślij kod/);
  assert.equal(panel.includes("fonts.googleapis"), false);
  assert.equal(panel.includes("accounts.google.com"), false);
  assert.match(google, /accounts\.google\.com/);
  assert.equal(google.includes("fonts.gstatic"), false);
  assert.match(mail, /\/api\/mail\/website\/login-code/);
  assert.equal(mail.includes("process.env.SMTP"), false);
  assert.match(readme, /AUTH_MAIL_API_KEY/);
  assert.match(readme, /GOOGLE_CLIENT_ID/);
  assert.match(readme, /GOOGLE_CLIENT_SECRET/);
  assert.match(legal, /Kod logowania wysyła CRM przez SMTP/);
  assert.equal(legal.includes("logowania telefonem i"), false);
});
});
