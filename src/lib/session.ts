import "server-only";
import { cookies } from "next/headers";
import type { SessionUser } from "./types";

export const TOKEN_COOKIE = "nm_token";
export const USER_COOKIE = "nm_user";

export const encodeUser = (user: SessionUser) => Buffer.from(JSON.stringify(user)).toString("base64url");

export const decodeUser = (value: string | undefined): SessionUser | null => {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
};

export async function getSession() {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  const user = decodeUser(store.get(USER_COOKIE)?.value);
  if (!token || !user) return null;
  return { token, user };
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
