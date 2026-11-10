import { isEmail, normalizeEmail } from "@/lib/auth/email";
import { googleSignInMode } from "@/lib/auth/google";
import { requireSessionId } from "@/lib/session";
import { loginGoogleProfile } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Lokalny Google, gdy nie ma GOOGLE_CLIENT_ID. W production wyłączony. */
export async function POST(request: Request) {
  if (googleSignInMode() !== "mock") {
    return Response.json({ error: "Google nie jest w trybie testowym" }, { status: 404 });
  }

  const sessionId = await requireSessionId();
  let body: { email?: unknown; name?: unknown } = {};
  try {
    body = (await request.json()) as { email?: unknown; name?: unknown };
  } catch {
    body = {};
  }
  const emailRaw = typeof body.email === "string" ? body.email : "google.mock@drukarycz.local";
  const email = isEmail(emailRaw) ? normalizeEmail(emailRaw) : "google.mock@drukarycz.local";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Gość Google";
  const result = await loginGoogleProfile(sessionId, {
    googleId: `mock:${email}`,
    email,
    name,
  });
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result.view);
}
