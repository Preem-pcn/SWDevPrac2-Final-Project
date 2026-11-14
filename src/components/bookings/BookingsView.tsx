"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { addDays, baht, dayKey, formatDay, todayKey } from "@/lib/date";
import { useLoad } from "@/lib/hooks";
import type { Booking, Spot } from "@/lib/types";
import { useSession } from "../session";
import { ErrorBox, Loading, Notice } from "../ui";
import Calendar from "./Calendar";
import { DeleteBookingModal, EditBookingModal } from "./Modals";

export default function BookingsView({ view, created }: { view: "list" | "calendar"; created?: string }) {
  const user = useSession();
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const bookings = useLoad(() => api<Booking[]>("/bookings"));
  const spots = useLoad(() => api<Spot[]>("/spots"));
  const [editing, setEditing] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState<Booking | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterZone, setFilterZone] = useState("");

  const all = useMemo(() => bookings.data ?? [], [bookings.data]);
  const today = todayKey();
  const createdBooking = created ? all.find((b) => b._id === created) : undefined;
  const zones = useMemo(() => [...new Set(all.map((b) => b.spot?.zone).filter(Boolean) as string[])].sort(), [all]);
  const rows = all.filter(
    (b) => (!filterDate || dayKey(b.bookingDate) === filterDate) && (!filterZone || b.spot?.zone === filterZone),
  );

  const setView = (v: "list" | "calendar") => router.replace(v === "list" ? "/bookings" : "/bookings?view=calendar", { scroll: false });

  const replace = (b: Booking) => bookings.setData(all.map((x) => (x._id === b._id ? b : x)).sort((a, z) => a.bookingDate.localeCompare(z.bookingDate)));

  const move = async (b: Booking, to: string) => {
    setMessage(null);
    if (to < today) {
      setMessage({ kind: "error", text: `${formatDay(to)} has passed, so ${b.spot?.spotNumber} stayed on ${formatDay(dayKey(b.bookingDate))}.` });
      return;
    }
    try {
      const updated = await api<Booking>(`/bookings/${b._id}`, { method: "PUT", body: { bookingDate: to } });
      replace(updated);
      setMessage({ kind: "ok", text: `Moved ${b.spot?.spotNumber} to ${formatDay(to)}.` });
    } catch (err) {
      setMessage({ kind: "error", text: `${err instanceof Error ? err.message : "Couldn’t move the booking."} ${b.spot?.spotNumber} stayed on ${formatDay(dayKey(b.bookingDate))}.` });
    }
  };

  // Quota summary for the member's next nights with bookings.
  const upcoming = all.filter((b) => dayKey(b.bookingDate) >= today);
  const perDay = new Map<string, number>();
  for (const b of upcoming) perDay.set(dayKey(b.bookingDate), (perDay.get(dayKey(b.bookingDate)) ?? 0) + 1);
  const summary = [...perDay.entries()].slice(0, 2).map(([d, n]) => `${n} of 3 spots on ${formatDay(d, "short")}`).join(" · ");

  // Admin stats for the chosen night (or tonight).
  const statDay = filterDate || today;
  const onStatDay = all.filter((b) => dayKey(b.bookingDate) === statDay);

  return (
    <div className="flex flex-col gap-7 px-5 pb-16 pt-6 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="display text-6xl md:text-[80px]">{isAdmin ? "All bookings" : "My bookings"}</h1>
          <p className="text-lg text-muted">
            {isAdmin
              ? `${all.length} bookings from ${new Set(all.map((b) => b.user?._id)).size} vendors`
              : upcoming.length
                ? summary
                : "No upcoming bookings yet."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex rounded-full bg-surface p-1" role="tablist" aria-label="View">
            {(["list", "calendar"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-full px-5 py-2.5 font-semibold capitalize transition-colors ${view === v ? "bg-sky text-onlight" : "hover:bg-field"}`}
              >
                {v}
              </button>
            ))}
          </div>
          {!isAdmin && (
            <Link href="/spots" className="btn bg-lantern text-onlight hover:bg-glow">
              Book another spot
            </Link>
          )}
        </div>
      </div>

      {createdBooking && !message && (
        <Notice>
          Booking confirmed: {createdBooking.spot?.spotNumber} on {formatDay(dayKey(createdBooking.bookingDate))}.{" "}
          <Link href={`/bookings/${createdBooking._id}/pass`} className="underline">
            Open its pass
          </Link>
        </Notice>
      )}
      {message && (message.kind === "ok" ? <Notice>{message.text}</Notice> : <ErrorBox>{message.text}</ErrorBox>)}
      {bookings.error && <ErrorBox>{bookings.error}</ErrorBox>}

      {isAdmin && view === "list" && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex w-[240px] flex-col gap-2">
              <span className="text-sm font-medium">Market night</span>
              <input type="date" className="input-base" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </label>
            <label className="flex w-[260px] flex-col gap-2">
              <span className="text-sm font-medium">Zone</span>
              <select className="input-base" value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
                <option value="">All zones</option>
                {zones.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </label>
            {(filterDate || filterZone) && (
              <button onClick={() => { setFilterDate(""); setFilterZone(""); }} className="btn btn-sm bg-field hover:bg-brand">
                Clear filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {[
              [String(onStatDay.length), `bookings on ${formatDay(statDay, "short")}`, true],
              [String((spots.data?.length ?? 0) - onStatDay.filter((b) => b.spot?.isActive !== false).length), `of ${spots.data?.length ?? 0} spots still free`, false],
              [String(new Set(onStatDay.map((b) => b.user?._id)).size), "vendors selling that night", false],
              [baht(onStatDay.reduce((s, b) => s + (b.spot?.rentalFee ?? 0), 0)), "rent due that night", false],
            ].map(([v, l, hi]) => (
              <div key={l as string} className={`rounded-[32px] px-7 py-6 ${hi ? "bg-lantern text-onlight" : "bg-surface"}`}>
                <p className="display text-5xl md:text-[56px]">{v}</p>
                <p className={`font-medium ${hi ? "" : "text-muted"}`}>{l}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {bookings.loading && !bookings.data ? (
        <Loading label="Loading bookings…" />
      ) : bookings.error ? null : view === "calendar" ? (
        <Calendar bookings={all} showVendor={isAdmin} onMove={move} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-[32px] bg-surface p-10">
          <p className="display text-3xl">{all.length ? "No bookings match these filters." : isAdmin ? "No bookings yet." : "You haven’t booked a spot yet."}</p>
          {!isAdmin && (
            <Link href="/spots" className="btn bg-lantern text-onlight hover:bg-glow">
              Find a spot
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-separate border-spacing-y-1 text-left">
            <thead className="text-sm text-muted">
              <tr>
                {[...(isAdmin ? ["Vendor"] : []), "Spot", "Zone", "Night", "Product type", "Rental fee", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((b, i) => {
                const past = dayKey(b.bookingDate) < today;
                return (
                  <tr key={b._id} className={`[&>td:first-child]:rounded-l-xl [&>td:last-child]:rounded-r-xl ${i % 2 ? "" : "bg-surface"} ${past ? "text-muted" : ""} ${b._id === created ? "bg-brand" : ""}`}>
                    {isAdmin && (
                      <td className="px-4 py-3 font-semibold">
                        {b.user?.name ?? "Deleted user"}
                        <span className="block text-sm font-normal text-muted">{b.user?.tel}</span>
                      </td>
                    )}
                    <td className="px-4 py-3 font-semibold">{b.spot?.spotNumber ?? "—"}{b.spot?.isActive === false && <span className="block text-xs font-normal text-danger">spot removed</span>}</td>
                    <td className="px-4 py-3">{b.spot?.zone ?? "—"}</td>
                    <td className="px-4 py-3">{formatDay(dayKey(b.bookingDate))}{past && <span className="block text-xs">past</span>}</td>
                    <td className="px-4 py-3">{b.productType}</td>
                    <td className="px-4 py-3">{b.spot ? baht(b.spot.rentalFee) : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/bookings/${b._id}/pass`} className="btn btn-sm bg-lantern text-onlight hover:bg-glow">Pass</Link>
                        {!past && (
                          <button onClick={() => setEditing(b)} className="btn btn-sm bg-field hover:bg-brand">Edit</button>
                        )}
                        <button onClick={() => setDeleting(b)} className="btn btn-sm bg-danger-surface text-danger hover:bg-danger hover:text-onlight">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isAdmin && view === "list" && bookings.data && <NextNights bookings={all} />}
      {isAdmin && view === "list" && spots.data && <ZoneBars spots={spots.data} bookings={onStatDay} day={statDay} />}

      <EditBookingModal
        booking={editing}
        spots={spots.data ?? []}
        known={all}
        canSeeOthers={isAdmin}
        onClose={() => setEditing(null)}
        onSaved={(b) => {
          replace(b);
          setEditing(null);
          setMessage({ kind: "ok", text: `Saved ${b.spot?.spotNumber} on ${formatDay(dayKey(b.bookingDate))}.` });
        }}
      />
      <DeleteBookingModal
        booking={deleting}
        showVendor={isAdmin}
        onClose={() => setDeleting(null)}
        onDeleted={(id) => {
          const gone = all.find((b) => b._id === id);
          bookings.setData(all.filter((b) => b._id !== id));
          setDeleting(null);
          setMessage({ kind: "ok", text: `Deleted ${gone?.spot?.spotNumber ?? "the"} booking. The spot is free again.` });
        }}
      />
    </div>
  );
}

function NextNights({ bookings }: { bookings: Booking[] }) {
  const today = todayKey();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  return (
    <section className="flex flex-col gap-5 pt-4">
      <h2 className="display text-3xl">Your next 7 market nights</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {days.map((d) => {
          const n = bookings.filter((b) => dayKey(b.bookingDate) === d).length;
          return (
            <Link key={d} href={`/spots?date=${d}`} className={`flex flex-col gap-2 rounded-[28px] p-5 transition-transform hover:-translate-y-0.5 ${n ? "bg-brand" : "bg-surface"}`}>
              <span className={n ? "" : "text-muted"}>{d === today ? "Tonight" : formatDay(d, "weekday")}</span>
              <span className="display text-5xl">{formatDay(d, "day")}</span>
              <span className="flex gap-1.5">
                {[0, 1, 2].map((i) => <span key={i} className={`size-3.5 rounded-full ${i < n ? "bg-lantern" : "bg-field"}`} />)}
              </span>
              <span className={`text-sm ${n ? "" : "text-muted"}`}>{n ? `${n} of 3 spots` : "Free night"}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function ZoneBars({ spots, bookings, day }: { spots: Spot[]; bookings: Booking[]; day: string }) {
  const zones = [...new Set(spots.map((s) => s.zone))].sort();
  return (
    <section className="flex flex-col gap-4">
      <h2 className="display text-2xl">Zones on {formatDay(day, "short")}</h2>
      <div className="grid gap-5 md:grid-cols-3">
        {zones.map((z) => {
          const total = spots.filter((s) => s.zone === z).length;
          const booked = bookings.filter((b) => b.spot?.zone === z && b.spot?.isActive !== false).length;
          return (
            <div key={z} className="flex flex-col gap-3 rounded-[28px] bg-surface px-6 py-5">
              <div className="flex justify-between gap-4">
                <span className="font-semibold">Zone {z}</span>
                <span className="text-muted">{booked} of {total} booked</span>
              </div>
              <div className="h-3 rounded-full bg-field">
                <div className="h-3 rounded-full bg-lantern transition-[width] duration-500" style={{ width: `${total ? (booked / total) * 100 : 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
