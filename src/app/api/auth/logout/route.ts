import { NextResponse } from "next/server";
import { TOKEN_COOKIE, USER_COOKIE } from "@/lib/session";

// Logging out only needs to drop our cookies. The backend's /auth/logout clears a cookie
// this app never uses, so calling it would only spend one of the limited requests.
export async function POST() {
  const res = NextResponse.json({ success: true, data: {} });
  res.cookies.delete(TOKEN_COOKIE);
  res.cookies.delete(USER_COOKIE);
  return res;
}
