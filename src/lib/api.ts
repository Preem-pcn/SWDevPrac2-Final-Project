"use client";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Client-side calls go through the Next.js proxy route, which attaches the
// JWT from an httpOnly cookie. The token never reaches browser JavaScript.
//
// GET responses are shared for 30 seconds: identical requests in flight reuse one
// promise (React dev mode runs effects twice) and moving between pages doesn't refetch.
// Any change (POST/PUT/DELETE) or login/logout clears the cache, so data never goes stale
// after the user's own actions. The backend allows only a limited number of requests per IP.
const TTL = 30_000;
const cache = new Map<string, { at: number; promise: Promise<unknown> }>();
export const clearApiCache = () => cache.clear();

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = init.method ?? "GET";
  if (method === "GET") {
    const hit = cache.get(path);
    if (hit && Date.now() - hit.at < TTL) return hit.promise as Promise<T>;
    const promise = request<T>(path, init);
    cache.set(path, { at: Date.now(), promise });
    promise.catch(() => cache.delete(path));
    return promise;
  }
  try {
    return await request<T>(path, init);
  } finally {
    cache.clear();
  }
}

async function request<T>(path: string, init: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    method: init.method ?? "GET",
    headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({ success: false, error: "Unexpected server response" }));
  if (!res.ok || !json.success) throw new ApiError(friendlyError(json.error, res.status), res.status);
  return json.data as T;
}

export async function authRequest(kind: "login" | "register" | "logout", body?: unknown) {
  clearApiCache();
  const res = await fetch(`/api/auth/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json().catch(() => ({ success: false, error: "Unexpected server response" }));
  if (!res.ok || !json.success) throw new ApiError(friendlyError(json.error, res.status), res.status);
  return json.data;
}

const known: Record<string, string> = {
  "Vendor spot is already booked on this date": "Another vendor already booked this spot that night.",
  "Member already has a booking for this spot on this date": "You already booked this spot that night.",
  "Member can book at most 3 spots per day": "You already hold 3 spots that night, the daily limit.",
  "Booking date cannot be in the past": "That night has passed. Pick today or a later date.",
  "Invalid credentials": "Email or password is incorrect.",
  "Vendor spot not found or inactive": "This spot is no longer available.",
};

export function friendlyError(error: unknown, status: number) {
  if (typeof error === "string") {
    if (known[error]) return known[error];
    if (error.includes("duplicate key") && error.includes("email")) return "An account with this email already exists.";
    if (status === 429) return "The booking server is getting too many requests. Wait a few minutes and try again.";
    return error;
  }
  return `Request failed (${status})`;
}
