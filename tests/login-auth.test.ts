import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { isEmail, normalizeEmail } from "../lib/auth/email.ts";
import { googleSignInMode, isGoogleConfigured, safeReturnTo } from "../lib/auth/google.ts";
import { authMethods } from "../lib/auth/methods.ts";
import { hashPassword, isPassword, passwordMatches } from "../lib/auth/password.ts";
import { ensureSession, loginGoogleProfile, loginWithPassword } from "../lib/store.ts";

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

test("hasło ma próg i skrót nie jest jawnym tekstem", async () => {
  assert.equal(isPassword("short"), false);
  assert.equal(isPassword("haslo123"), true);
  const stored = await hashPassword("haslo123");
  assert.equal(stored.includes("haslo123"), false);
  assert.equal(await passwordMatches("haslo123", stored), true);
  assert.equal(await passwordMatches("innehaslo", stored), false);
});

test("bez Google metody są mockiem", () =>
  withEnv(
    {
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      NODE_ENV: "development",
    },
    () => {
      assert.equal(isGoogleConfigured(), false);
      assert.equal(googleSignInMode(), "mock");
      const methods = authMethods();
      assert.equal(methods.email, true);
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

test("safeReturnTo nie puszcza /api", () => {
  const request = new Request("http://127.0.0.1:43141/api/auth/google?next=/koszulka");
  assert.equal(safeReturnTo(request), "/koszulka");
  const evil = new Request("http://127.0.0.1:43141/api/auth/google?next=//evil.example");
  assert.equal(safeReturnTo(evil), "/");
  const api = new Request("http://127.0.0.1:43141/api/auth/google?next=/api/auth/logout");
  assert.equal(safeReturnTo(api), "/");
});

test("dwa e-maile i dwa hasła logują; pary muszą być takie same", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "drukarycz-login-"));
  const previousStore = process.env.MERCH_STORE;
  process.env.MERCH_STORE = path.join(dir, "store.json");
  try {
    const session = await ensureSession(null);
    const mismatchEmail = await loginWithPassword(session.id, {
      email: "anna@example.com",
      emailConfirm: "inna@example.com",
      password: "haslo123",
      passwordConfirm: "haslo123",
    });
    assert.equal("error" in mismatchEmail, true);
    if ("error" in mismatchEmail) assert.match(mismatchEmail.error, /E-maile/);

    const mismatchPassword = await loginWithPassword(session.id, {
      email: "anna@example.com",
      emailConfirm: "anna@example.com",
      password: "haslo123",
      passwordConfirm: "haslo999",
    });
    assert.equal("error" in mismatchPassword, true);
    if ("error" in mismatchPassword) assert.match(mismatchPassword.error, /Hasła/);

    const created = await loginWithPassword(session.id, {
      email: "Anna@Example.com",
      emailConfirm: "anna@example.com",
      password: "haslo123",
      passwordConfirm: "haslo123",
    });
    assert.equal("error" in created, false);
    if ("error" in created) return;
    assert.equal(created.view.user?.email, "anna@example.com");
    assert.equal(created.view.user?.name, "anna");
    assert.equal(created.view.user?.phone, "");
    assert.equal(created.view.work.order.email, "anna@example.com");
    assert.equal(created.view.devCode, null);
    assert.equal(JSON.stringify(created.view).includes("passwordHash"), false);

    const wrong = await loginWithPassword(session.id, {
      email: "anna@example.com",
      emailConfirm: "anna@example.com",
      password: "zlehaslo",
      passwordConfirm: "zlehaslo",
    });
    assert.equal("error" in wrong, true);

    const again = await loginWithPassword(session.id, {
      email: "anna@example.com",
      emailConfirm: "anna@example.com",
      password: "haslo123",
      passwordConfirm: "haslo123",
    });
    assert.equal("error" in again, false);
    if ("error" in again) return;
    assert.equal(again.view.user?.id, created.view.user?.id);

    const google = await loginGoogleProfile(session.id, {
      googleId: "sub-1",
      email: "anna@example.com",
      name: "Anna G",
    });
    assert.equal("error" in google, false);
    if ("error" in google) return;
    assert.equal(google.view.user?.id, created.view.user?.id);
    assert.equal(google.view.user?.name, "Anna G");
  } finally {
    if (previousStore === undefined) delete process.env.MERCH_STORE;
    else process.env.MERCH_STORE = previousStore;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("konto tylko przez Google nie przyjmuje hasła", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "drukarycz-login-g-"));
  const previousStore = process.env.MERCH_STORE;
  process.env.MERCH_STORE = path.join(dir, "store.json");
  try {
    const session = await ensureSession(null);
    const google = await loginGoogleProfile(session.id, {
      googleId: "sub-google-only",
      email: "gosia@example.com",
      name: "Gosia",
    });
    assert.equal("error" in google, false);
    const blocked = await loginWithPassword(session.id, {
      email: "gosia@example.com",
      emailConfirm: "gosia@example.com",
      password: "haslo123",
      passwordConfirm: "haslo123",
    });
    assert.equal("error" in blocked, true);
    if ("error" in blocked) assert.match(blocked.error, /Google/);
  } finally {
    if (previousStore === undefined) delete process.env.MERCH_STORE;
    else process.env.MERCH_STORE = previousStore;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("panel i README: dwa e-maile, dwa hasła, Google, bez OTP i SMS", () => {
  const panel = fs.readFileSync("components/login-panel.tsx", "utf8");
  const readme = fs.readFileSync("README.md", "utf8");
  const legal = fs.readFileSync("components/legal-documents.tsx", "utf8");
  const google = fs.readFileSync("lib/auth/google.ts", "utf8");
  assert.match(panel, /Wejdź przez Google/);
  assert.match(panel, /Powtórz e-mail/);
  assert.match(panel, /Powtórz hasło/);
  assert.match(panel, /\/api\/auth\/login/);
  assert.equal(panel.includes("Wyślij kod"), false);
  assert.equal(panel.includes("devCode"), false);
  assert.equal(panel.includes("type=\"tel\""), false);
  assert.equal(/SMS/i.test(panel), false);
  assert.equal(panel.includes("fonts.googleapis"), false);
  assert.equal(panel.includes("accounts.google.com"), false);
  assert.match(google, /accounts\.google\.com/);
  assert.equal(google.includes("fonts.gstatic"), false);
  assert.equal(fs.existsSync("lib/auth/crm-mail.ts"), false);
  assert.equal(fs.existsSync("app/api/auth/code/route.ts"), false);
  assert.equal(fs.existsSync("app/api/auth/verify/route.ts"), false);
  assert.equal(readme.includes("AUTH_MAIL_API_KEY"), false);
  assert.equal(readme.includes("/api/mail/website/login-code"), false);
  assert.match(readme, /GOOGLE_CLIENT_ID/);
  assert.match(readme, /GOOGLE_CLIENT_SECRET/);
  assert.match(readme, /POST \/api\/auth\/login/);
  assert.match(legal, /e-mail i hasło, oba wpisane dwa razy/);
  assert.equal(legal.includes("Kod logowania wysyła CRM przez SMTP"), false);
  assert.equal(legal.includes("logowania telefonem i"), false);
});
});
