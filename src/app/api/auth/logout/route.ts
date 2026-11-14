import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";
import { TOKEN_COOKIE, USER_COOKIE, getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  if (session) await backend("/auth/logout", { token: session.token });
  const res = NextResponse.json({ success: true, data: {} });
  res.cookies.delete(TOKEN_COOKIE);
  res.cookies.delete(USER_COOKIE);
  return res;
}
