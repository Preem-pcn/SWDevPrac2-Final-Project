import "server-only";

export const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "");

// The backend allows 100 requests per IP every 10 minutes, and once deployed every
// request comes from this server's IP. Spot data is public and the same for every
// user, so the server keeps it for a minute and serves all visitors from that copy.
// Any spot change made through this server clears it.
const SPOTS_TTL = 60_000;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Result = { status: number; json: { success: boolean; error?: string; data?: any; count?: number } };
const spotsCache = new Map<string, { at: number; result: Result }>();

export async function backend(path: string, init: { method?: string; body?: unknown; token?: string } = {}): Promise<Result> {
  const method = init.method ?? "GET";
  const isSpots = path === "/spots" || path.startsWith("/spots/");
  if (isSpots && method === "GET") {
    const hit = spotsCache.get(path);
    if (hit && Date.now() - hit.at < SPOTS_TTL) return hit.result;
  }
  const result = await send(path, init);
  if (isSpots && method === "GET" && result.status === 200) spotsCache.set(path, { at: Date.now(), result });
  if (isSpots && method !== "GET" && result.json.success) spotsCache.clear();
  return result;
}

async function send(path: string, init: { method?: string; body?: unknown; token?: string }): Promise<Result> {
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({ success: false, error: `Backend returned ${res.status}` }));
    return { status: res.status, json };
  } catch {
    return { status: 502, json: { success: false, error: "Can't reach the booking server. Is the backend running?" } };
  }
}
