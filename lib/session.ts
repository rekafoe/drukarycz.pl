import { cookies } from "next/headers";
import { sessionCookieName } from "@/lib/seller";
import { ensureSession } from "@/lib/store";

export const SESSION_COOKIE = sessionCookieName;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  secure: process.env.NODE_ENV === "production",
};

export async function currentSession() {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value ?? null;
  const result = await ensureSession(existing);
  if (result.isNew) jar.set(SESSION_COOKIE, result.id, cookieOptions);
  return result.view;
}

export async function requireSessionId() {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value ?? null;
  const result = await ensureSession(existing);
  if (result.isNew) jar.set(SESSION_COOKIE, result.id, cookieOptions);
  return result.id;
}
