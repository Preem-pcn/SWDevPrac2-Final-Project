"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authRequest } from "@/lib/api";
import type { SessionUser } from "@/lib/types";
import { ErrorBox, Field } from "../ui";

export default function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user: SessionUser = await authRequest("login", { email, password });
      const fallback = user.role === "admin" ? "/admin" : "/spots";
      router.replace(next && next.startsWith("/") ? next : fallback);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-[480px] flex-col gap-5" noValidate>
      <h2 className="display text-5xl">Log in</h2>
      {error && <ErrorBox>{error}</ErrorBox>}
      <Field label="Email">
        <input className="input-base" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </Field>
      <Field label="Password">
        <input className="input-base" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <button disabled={busy || !email || !password} className="btn mt-1 w-full bg-lantern text-onlight hover:bg-glow">
        {busy ? "Logging in…" : "Log in"}
      </button>
      <p className="text-muted">
        New vendor?{" "}
        <Link href="/register" className="font-medium text-sky hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
