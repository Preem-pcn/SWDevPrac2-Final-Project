import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";
import { TOKEN_COOKIE, USER_COOKIE, cookieOptions, encodeUser } from "@/lib/session";
import type { SessionUser } from "@/lib/types";

export async function authenticate(path: "/auth/login" | "/auth/register", body: unknown) {
  const { status, json } = await backend(path, { method: "POST", body });
  if (!json.success) return NextResponse.json(json, { status });
  const { token, id, name, email, role } = json.data;
  const user: SessionUser = { id, name, email, role };
  const res = NextResponse.json({ success: true, data: user }, { status });
  res.cookies.set(TOKEN_COOKIE, token, cookieOptions);
  res.cookies.set(USER_COOKIE, encodeUser(user), cookieOptions);
  return res;
}
