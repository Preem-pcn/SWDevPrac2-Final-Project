"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { baht, dayKey, formatDay, todayKey } from "@/lib/date";
import { useLoad } from "@/lib/hooks";
import type { Booking, Spot } from "@/lib/types";
import { Legend, SpotMap, type TileState, byNumber } from "../SpotMap";
import { useSession } from "../session";
import { ErrorBox, Loading } from "../ui";

export default function SpotsView({ initialSpot, initialDate }: { initialSpot?: string; initialDate?: string }) {
  const user = useSession();
  const [date, setDate] = useState(initialDate && initialDate >= todayKey() ? initialDate : todayKey());
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSpot);

  const spots = useLoad(() => api<Spot[]>("/spots"));
  const bookings = useLoad(() => (user ? api<Booking[]>("/bookings") : Promise.resolve([] as Booking[])), [user?.id]);

  const onDate = useMemo(() => (bookings.data ?? []).filter((b) => dayKey(b.bookingDate) === date && b.spot), [bookings.data, date]);
  const bySpot = useMemo(() => new Map(onDate.map((b) => [b.spot!._id, b])), [onDate]);
  const list = useMemo(() => [...(spots.data ?? [])].sort((a, b) => a.zone.localeCompare(b.zone) || byNumber(a, b)), [spots.data]);
  const selected = list.find((s) => s._id === selectedId) ?? list[0];

  const stateOf = (s: Spot): TileState => {
    if (s._id === selected?._id) return "selected";
    const b = bySpot.get(s._id);
    if (!b) return "available";
    if (user?.role === "member") return "mine";
    return "booked";
  };

  const mineCount = user?.role === "member" ? onDate.length : 0;
  const freeCount = list.length - (user?.role === "admin" ? onDate.length : 0);
  const selectedBooking = selected ? bySpot.get(selected._id) : undefined;

  return (
    <div className="flex flex-col gap-7 px-5 pb-16 pt-6 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="display text-6xl md:text-[80px]">Pick a spot</h1>
          <p className="text-lg text-muted">
            {user?.role === "admin"
              ? `${freeCount} of ${list.length} spots are free on ${formatDay(date)}.`
              : user?.role === "member"
                ? `You hold ${mineCount} of 3 spots on ${formatDay(date)}.`
                : `${list.length} spots across the market. Log in to book one.`}
          </p>
        </div>
        <label className="flex w-full max-w-[280px] flex-col gap-2">
          <span className="text-sm font-medium">Market night</span>
          <input type="date" className="input-base" min={todayKey()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
      </div>

      <Legend
        items={
          user?.role === "admin"
            ? [["available", "Free"], ["booked", "Booked"], ["selected", "Selected"]]
            : user?.role === "member"
              ? [["available", "Bookable"], ["mine", "Your booking"], ["selected", "Selected"]]
              : [["available", "Spot"], ["selected", "Selected"]]
        }
      />

      {spots.error && <ErrorBox>{spots.error}</ErrorBox>}
      {spots.loading && !spots.data ? (
        <Loading label="Loading the market map…" />
      ) : spots.error ? null : list.length === 0 ? (
        <p className="text-lg text-muted">No spots yet.</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="flex flex-col gap-10">
            <SpotMap spots={list} stateOf={stateOf} onSelect={(s) => setSelectedId(s._id)} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-y-1 text-left">
                <thead className="text-sm text-muted">
                  <tr>
                    {["Spot", "Zone", "Size", "Location", "Rental fee"].map((h) => (
                      <th key={h} className="px-4 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr
                      key={s._id}
                      onClick={() => setSelectedId(s._id)}
                      className={`cursor-pointer transition-colors [&>td:first-child]:rounded-l-xl [&>td:last-child]:rounded-r-xl ${s._id === selected?._id ? "bg-brand" : "bg-surface hover:bg-field"}`}
                    >
                      <td className="px-4 py-3.5 font-semibold">{s.spotNumber}</td>
                      <td className="px-4 py-3.5">{s.zone}</td>
                      <td className="px-4 py-3.5">{s.spotSize}</td>
                      <td className="px-4 py-3.5">{s.locationDescription}</td>
                      <td className="px-4 py-3.5">{baht(s.rentalFee)} per night</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <aside className="flex h-fit flex-col gap-5 rounded-[32px] bg-brand p-8 lg:sticky lg:top-24">
              <p className="display text-[128px]">{selected.spotNumber}</p>
              {[
                ["Zone", selected.zone],
                ["Spot size", selected.spotSize],
                ["Location", selected.locationDescription],
                ["Rental fee", `${baht(selected.rentalFee)} per night`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-sm font-medium">{k}</p>
                  <p className="text-xl font-semibold">{v}</p>
                </div>
              ))}
              {!user && (
                <>
                  <Link href={`/login?next=${encodeURIComponent(`/bookings/new?spot=${selected._id}&date=${date}`)}`} className="btn bg-lantern text-onlight hover:bg-glow">
                    Book {selected.spotNumber}
                  </Link>
                  <p className="text-sm">Log in to book. Viewing spots is open to everyone.</p>
                </>
              )}
              {user?.role === "member" &&
                (selectedBooking ? (
                  <>
                    <Link href={`/bookings/${selectedBooking._id}/pass`} className="btn bg-sky text-onlight">
                      You booked this spot · view pass
                    </Link>
                    <p className="text-sm">Selling {selectedBooking.productType} on {formatDay(date)}.</p>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/bookings/new?spot=${selected._id}&date=${date}`}
                      aria-disabled={mineCount >= 3}
                      className={`btn bg-lantern text-onlight hover:bg-glow ${mineCount >= 3 ? "pointer-events-none opacity-50" : ""}`}
                    >
                      Book {selected.spotNumber} for {formatDay(date, "short")}
                    </Link>
                    <p className="text-sm">
                      {mineCount >= 3
                        ? "You already hold 3 spots this night, the daily limit."
                        : `You have ${mineCount} of 3 spots booked on this date. If another vendor has this spot, we’ll tell you when you confirm.`}
                    </p>
                  </>
                ))}
              {user?.role === "admin" && (
                <>
                  {selectedBooking && (
                    <p className="rounded-2xl bg-night/40 px-4 py-3">
                      Booked by <b>{selectedBooking.user?.name ?? "a vendor"}</b> for {selectedBooking.productType}
                    </p>
                  )}
                  <Link href={`/admin/spots/${selected._id}/edit`} className="btn bg-lantern text-onlight hover:bg-glow">
                    Edit {selected.spotNumber}
                  </Link>
                </>
              )}
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
