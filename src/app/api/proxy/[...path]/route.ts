import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";
import { bookingIsLocked, bookingLockMessage } from "@/lib/booking-policy";
import { getSession } from "@/lib/session";

// Forwards /api/proxy/<path> to the backend's /api/v1/<path>, adding the
// bearer token from the session cookie. Only the resources the UI needs are allowed.
const ALLOWED = new Set(["spots", "bookings"]);

async function forward(request: Request, ctx: RouteContext<"/api/proxy/[...path]">) {
  const { path } = await ctx.params;
  if (!ALLOWED.has(path[0])) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  const session = await getSession();
  if (path[0] === "bookings" && path.length === 2 && ["PUT", "DELETE"].includes(request.method)) {
    // Resolve the role from the authenticated backend, never the display cookie.
    const viewer = await backend("/auth/me", { token: session?.token });
    if (!viewer.json.success) return NextResponse.json(viewer.json, { status: viewer.status });
    if (viewer.json.data?.role !== "admin") {
      const original = await backend(`/bookings/${encodeURIComponent(path[1])}`, { token: session?.token });
      if (!original.json.success) return NextResponse.json(original.json, { status: original.status });
      if (bookingIsLocked(original.json.data.bookingDate)) {
        return NextResponse.json({ success: false, error: bookingLockMessage(original.json.data.bookingDate) }, { status: 403 });
      }
    }
  }
  const body = request.method === "GET" || request.method === "DELETE" ? undefined : await request.json().catch(() => ({}));
  const { status, json } = await backend(`/${path.map(encodeURIComponent).join("/")}`, {
    method: request.method,
    body,
    token: session?.token,
  });
  return NextResponse.json(json, { status });
}

export { forward as GET, forward as POST, forward as PUT, forward as DELETE };
