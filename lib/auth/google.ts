/**
 * Wejście przez Google: code flow na serwerze strony.
 * Przeglądarka idzie tylko na accounts.google.com (wyjątek od „bez obcych zasobów”),
 * potem wraca na /api/auth/google/callback. Czcionek Google nie ładujemy.
 * Bez GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — mock, Railway wstaje.
 */

export const GOOGLE_CLIENT_ID_ENV = "GOOGLE_CLIENT_ID";
export const GOOGLE_CLIENT_SECRET_ENV = "GOOGLE_CLIENT_SECRET";
export const GOOGLE_REDIRECT_URI_ENV = "GOOGLE_REDIRECT_URI";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const SCOPE = "openid email profile";

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
};

export function googleClientId() {
  return (process.env.GOOGLE_CLIENT_ID ?? "").trim();
}

export function googleClientSecret() {
  return (process.env.GOOGLE_CLIENT_SECRET ?? "").trim();
}

export function isGoogleConfigured() {
  return googleClientId().length > 0 && googleClientSecret().length > 0;
}

/** W production bez sekretów przycisk Google znika. Poza nim jest lokalny mock. */
export function googleSignInMode(): "live" | "mock" | "off" {
  if (isGoogleConfigured()) return "live";
  return process.env.NODE_ENV === "production" ? "off" : "mock";
}

export function googleRedirectUri(request: Request) {
  const override = (process.env.GOOGLE_REDIRECT_URI ?? "").trim();
  if (override) return override.replace(/\/+$/, "");
  const site = (process.env.SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (site) return `${site}/api/auth/google/callback`;
  return `${new URL(request.url).origin}/api/auth/google/callback`;
}

export function googleAuthorizationUrl(input: {
  request: Request;
  state: string;
  nonce: string;
}) {
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", googleClientId());
  url.searchParams.set("redirect_uri", googleRedirectUri(input.request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("state", input.state);
  url.searchParams.set("nonce", input.nonce);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export function safeReturnTo(request: Request) {
  const here = new URL(request.url);
  const next = here.searchParams.get("next");
  if (next && isSafePath(next)) return next;
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const ref = new URL(referer);
      if (ref.origin === here.origin && isSafePath(ref.pathname)) {
        return `${ref.pathname}${ref.search}`;
      }
    } catch {
      /* ignore */
    }
  }
  return "/";
}

function isSafePath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return false;
  if (value.startsWith("/api/")) return false;
  return true;
}

export async function exchangeGoogleCode(request: Request, code: string): Promise<GoogleProfile | { error: string }> {
  if (!isGoogleConfigured()) return { error: "Google nie jest podłączone" };
  const body = new URLSearchParams({
    code,
    client_id: googleClientId(),
    client_secret: googleClientSecret(),
    redirect_uri: googleRedirectUri(request),
    grant_type: "authorization_code",
  });
  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
      signal: AbortSignal.timeout(8_000),
      redirect: "error",
    });
  } catch {
    return { error: "Google nie odpowiada" };
  }
  if (!tokenResponse.ok) return { error: "Google nie wydało tokenu" };
  const tokenJson = (await tokenResponse.json()) as { access_token?: unknown };
  const accessToken = typeof tokenJson.access_token === "string" ? tokenJson.access_token : "";
  if (!accessToken) return { error: "Google nie wydało tokenu" };

  let profileResponse: Response;
  try {
    profileResponse = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
      redirect: "error",
    });
  } catch {
    return { error: "Google nie oddało profilu" };
  }
  if (!profileResponse.ok) return { error: "Google nie oddało profilu" };
  const profile = (await profileResponse.json()) as {
    sub?: unknown;
    email?: unknown;
    email_verified?: unknown;
    name?: unknown;
    given_name?: unknown;
  };
  const googleId = typeof profile.sub === "string" ? profile.sub : "";
  const email = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
  if (!googleId || !email) return { error: "Konto Google bez e-maila" };
  if (profile.email_verified === false) return { error: "E-mail Google nie jest potwierdzony" };
  const name =
    (typeof profile.name === "string" && profile.name.trim()) ||
    (typeof profile.given_name === "string" && profile.given_name.trim()) ||
    email.split("@")[0] ||
    "Gość";
  return { googleId, email, name };
}
