"use client";

import { useEffect } from "react";

export function Field({
  label,
  error,
  help,
  children,
}: {
  label: string;
  error?: string | null;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="text-sm text-danger">{error}</span> : help ? <span className="text-sm text-muted">{help}</span> : null}
    </label>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-2xl bg-danger-surface px-4 py-3.5 font-medium text-danger">
      {children}
    </div>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-sky px-4 py-3.5 font-semibold text-onlight">{children}</div>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-muted" aria-live="polite">
      <span className="size-3 animate-pulse rounded-full bg-lantern" />
      {label}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  width = "max-w-xl",
  children,
}: {
  open: boolean;
  onClose: () => void;
  width?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-x-0 bottom-0 top-20 z-30 flex items-center justify-center bg-night/75 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" className={`rise w-full ${width} max-h-full overflow-y-auto rounded-[36px] bg-surface p-6 md:p-10`}>
        {children}
      </div>
    </div>
  );
}

export function SummaryRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="flex flex-col gap-2.5 rounded-3xl bg-night px-6 py-5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-6">
          <dt className="text-muted">{k}</dt>
          <dd className="text-right font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
