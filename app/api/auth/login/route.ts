import { loginWithPassword } from "@/lib/store";
import { requireSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionId = await requireSessionId();
  let body: { email?: unknown; emailConfirm?: unknown; password?: unknown; passwordConfirm?: unknown };
  try {
    body = (await request.json()) as {
      email?: unknown;
      emailConfirm?: unknown;
      password?: unknown;
      passwordConfirm?: unknown;
    };
  } catch {
    return Response.json({ error: "Podaj e-mail i hasło" }, { status: 400 });
  }
  const result = await loginWithPassword(sessionId, {
    email: typeof body.email === "string" ? body.email : "",
    emailConfirm: typeof body.emailConfirm === "string" ? body.emailConfirm : "",
    password: typeof body.password === "string" ? body.password : "",
    passwordConfirm: typeof body.passwordConfirm === "string" ? body.passwordConfirm : "",
  });
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result.view);
}
