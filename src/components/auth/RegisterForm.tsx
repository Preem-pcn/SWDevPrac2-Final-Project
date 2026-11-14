"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authRequest } from "@/lib/api";
import type { Role } from "@/lib/types";
import { ErrorBox, Field } from "../ui";

type Errors = Partial<Record<"name" | "email" | "tel" | "password", string>>;

const validate = (v: { name: string; email: string; tel: string; password: string }): Errors => {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Enter your name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "Enter a valid email, like name@example.com";
  const digits = v.tel.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 10 || /[^\d\s\-+]/.test(v.tel)) e.tel = "Enter a 9 or 10-digit phone number";
  if (v.password.length < 6) e.password = "Use at least 6 characters";
  return e;
};

export default function RegisterForm() {
  const router = useRouter();
  const [v, setV] = useState({ name: "", email: "", tel: "", password: "" });
  const [role, setRole] = useState<Role>("member");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(v);
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await authRequest("register", { ...v, name: v.name.trim(), tel: v.tel.trim(), role });
      router.replace(role === "admin" ? "/admin" : "/spots");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Registration failed");
      setBusy(false);
    }
  };

  const count = Object.keys(errors).length;

  return (
    <form onSubmit={submit} className="flex w-full max-w-[480px] flex-col gap-[18px]" noValidate>
      <h2 className="display text-5xl">Register</h2>
      {count > 0 && <ErrorBox>Check {count === 1 ? "1 field" : `${count} fields`} before creating your account.</ErrorBox>}
      {serverError && <ErrorBox>{serverError}</ErrorBox>}
      <Field label="Name" error={errors.name}>
        <input className="input-base" autoComplete="name" value={v.name} onChange={set("name")} aria-invalid={!!errors.name} />
      </Field>
      <Field label="Email" error={errors.email}>
        <input className="input-base" type="email" autoComplete="email" value={v.email} onChange={set("email")} aria-invalid={!!errors.email} />
      </Field>
      <Field label="Tel" error={errors.tel}>
        <input className="input-base" type="tel" autoComplete="tel" value={v.tel} onChange={set("tel")} aria-invalid={!!errors.tel} placeholder="081-234-5678" />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Role</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["member", "admin"] as Role[]).map((r) => (
            <button
              type="button"
              key={r}
              aria-pressed={role === r}
              onClick={() => setRole(r)}
              className={`rounded-xl px-4 py-3.5 font-semibold capitalize transition-colors ${role === r ? "bg-lantern text-onlight" : "bg-field hover:bg-brand"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </fieldset>
      <Field label="Password" error={errors.password} help="At least 6 characters">
        <input className="input-base" type="password" autoComplete="new-password" value={v.password} onChange={set("password")} aria-invalid={!!errors.password} />
      </Field>
      <button disabled={busy} className="btn mt-1 w-full bg-lantern text-onlight hover:bg-glow">
        {busy ? "Creating account…" : "Create account"}
      </button>
      <p className="text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-sky hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
