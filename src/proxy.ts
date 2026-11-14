import { NextResponse, type NextRequest } from "next/server";

// Optimistic route protection. The backend still enforces every permission.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("nm_token")?.value;
  const rawUser = request.cookies.get("nm_user")?.value;
  let role: string | undefined;
  try {
    const b64 = rawUser?.replace(/-/g, "+").replace(/_/g, "/");
    role = b64 ? JSON.parse(atob(b64 + "===".slice((b64.length + 3) % 4))).role : undefined;
  } catch {
    role = undefined;
  }

  if (!token || !role) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/bookings", request.url));
  }
  if (pathname.startsWith("/bookings/new") && role !== "member") {
    return NextResponse.redirect(new URL("/bookings", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/bookings/:path*", "/admin/:path*"],
};
