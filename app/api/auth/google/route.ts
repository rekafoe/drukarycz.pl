import { randomBytes } from "crypto";
import { googleAuthorizationUrl, googleSignInMode, isGoogleConfigured, safeReturnTo } from "@/lib/auth/google";
import { requireSessionId } from "@/lib/session";
import { beginGoogleOauth } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isGoogleConfigured()) {
    const mode = googleSignInMode();
    if (mode === "mock") {
      return Response.redirect(new URL("/?login=1", request.url), 302);
    }
    return Response.redirect(new URL("/?login=1&error=google", request.url), 302);
  }

  const sessionId = await requireSessionId();
  const state = randomBytes(24).toString("base64url");
  const nonce = randomBytes(16).toString("base64url");
  const returnTo = safeReturnTo(request);
  const saved = await beginGoogleOauth(sessionId, { state, nonce, returnTo });
  if ("error" in saved) {
    return Response.redirect(new URL("/?login=1&error=google", request.url), 302);
  }
  return Response.redirect(googleAuthorizationUrl({ request, state, nonce }), 302);
}
