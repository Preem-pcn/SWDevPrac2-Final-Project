"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authRequest } from "@/lib/api";
import { useSession } from "./session";

const links = {
  guest: [{ href: "/spots", label: "Spots" }],
  member: [
    { href: "/spots", label: "Spots" },
    { href: "/bookings", label: "My bookings" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard" },
    { href: "/bookings", label: "All bookings" },
    { href: "/admin/spots", label: "Manage spots" },
  ],
};

export default function Nav() {
  const user = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const items = links[user?.role ?? "guest"];

  const logout = async () => {
    setBusy(true);
    try {
      await authRequest("logout");
    } finally {
      setBusy(false);
      router.push(user?.role === "admin" ? "/" : "/login");
      router.refresh();
    }
  };

  const active = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 bg-night/95 backdrop-blur-none">
      <nav className="mx-auto grid min-h-20 max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-4 px-5 py-4 md:flex md:h-20 md:justify-between md:gap-6 md:px-10 md:py-0">
        <div className="contents md:flex md:items-center md:gap-12">
          <Link href="/" className="display text-2xl text-lantern md:text-3xl">
            Saengdao
          </Link>
          <div className="col-span-2 row-start-2 flex items-center gap-4 md:gap-8">
            {items.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium transition-colors md:text-base ${
                  active(l.href) ? "text-lantern" : "text-ink hover:text-sky"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="col-start-2 row-start-1 flex items-center gap-3 md:gap-5">
          {user ? (
            <>
              <span className="hidden text-muted md:inline">
                {user.name} · {user.role}
              </span>
              <button onClick={logout} disabled={busy} className="btn btn-sm bg-field text-ink hover:bg-brand">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-sky md:text-base">
                Log in
              </Link>
              <Link href="/register" className="btn btn-sm bg-lantern text-onlight hover:bg-glow">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
