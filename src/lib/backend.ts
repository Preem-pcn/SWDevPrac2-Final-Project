import "server-only";

export const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:5000").replace(/\/$/, "");

export async function backend(path: string, init: { method?: string; body?: unknown; token?: string } = {}) {
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
