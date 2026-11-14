import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";
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
  const body = request.method === "GET" || request.method === "DELETE" ? undefined : await request.json().catch(() => ({}));
  const { status, json } = await backend(`/${path.map(encodeURIComponent).join("/")}`, {
    method: request.method,
    body,
    token: session?.token,
  });
  return NextResponse.json(json, { status });
}

export { forward as GET, forward as POST, forward as PUT, forward as DELETE };
