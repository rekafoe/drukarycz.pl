import { exchangeGoogleCode } from "@/lib/auth/google";
import { requireSessionId } from "@/lib/session";
import { loginGoogleProfile, takeGoogleOauth } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function fail(request: Request, path = "/?login=1&error=google") {
  return Response.redirect(new URL(path, request.url), 302);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("error")) return fail(request);

  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  if (!code || !state) return fail(request);

  const sessionId = await requireSessionId();
  const pending = await takeGoogleOauth(sessionId, state);
  if ("error" in pending) return fail(request);

  const profile = await exchangeGoogleCode(request, code);
  if ("error" in profile) return fail(request);

  const result = await loginGoogleProfile(sessionId, profile);
  if ("error" in result) return fail(request);

  const returnTo = pending.oauth.returnTo || "/";
  return Response.redirect(new URL(returnTo, request.url), 302);
}
