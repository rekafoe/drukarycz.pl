import { authMethods } from "@/lib/auth/methods";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json(authMethods());
}
