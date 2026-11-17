"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { addDays, baht, dayKey, formatDay, todayKey } from "@/lib/date";
import { useLoad } from "@/lib/hooks";
import type { Booking, Spot } from "@/lib/types";
import { ErrorBox, Loading } from "../ui";
import { ZoneBars } from "../bookings/BookingsView";

export default function Dashboard() {
  const bookings = useLoad(() => api<Booking[]>("/bookings"));
  const spots = useLoad(() => api<Spot[]>("/spots"));
  const [date, setDate] = useState(todayKey);
  const [anchor, setAnchor] = useState(todayKey);
  const all = bookings.data ?? [];
  const active = (spots.data ?? []).filter((s) => s.isActive !== false);
  const selected = all.filter((b) => dayKey(b.bookingDate) === date);
  const occupied = new Set(selected.filter((b) => active.some((s) => s._id === b.spot?._id)).map((b) => b.spot!._id)).size;
  const days = Array.from({ length: 7 }, (_, i) => addDays(anchor, i));
  const counts = days.map((d) => all.filter((b) => dayKey(b.bookingDate) === d).length);
  const max = Math.max(1, ...counts);
  const latest = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  return <div className="flex flex-col gap-7 px-5 pb-16 pt-6 md:px-10">
    <div className="flex flex-wrap justify-between items-end gap-5"><div><p className="text-lantern mb-3">MARKET OVERVIEW</p><h1 className="display text-6xl md:text-[80px]">Dashboard</h1><p className="text-muted mt-3">A little planning. A great market night.</p></div><label className="flex flex-col gap-2">Market night<input type="date" className="input-base" value={date} onChange={(e) => { if (e.target.value) { setDate(e.target.value); setAnchor(e.target.value); } }} /></label></div>
    {(bookings.error || spots.error) && <ErrorBox>{bookings.error || spots.error}</ErrorBox>}
    {bookings.loading || spots.loading ? <Loading /> : bookings.error || spots.error ? null : <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">{[[String(selected.length), "bookings tonight"], [String(Math.max(0, active.length - occupied)), `of ${active.length} spots still free`], [String(new Set(selected.flatMap((b) => b.user ? [b.user._id] : [])).size), "vendors selling tonight"], [baht(selected.reduce((sum, b) => sum + (b.spot?.rentalFee ?? 0), 0)), "total rental fees"]].map(([value, label], i) => <div key={label} className={`rounded-[32px] p-6 ${i === 0 ? "bg-lantern text-onlight" : "bg-surface"}`}><p className="display text-4xl md:text-5xl break-words">{value}</p><p className={`mt-3 ${i ? "text-muted" : ""}`}>{label.replace("tonight", formatDay(date, "short"))}</p></div>)}</div>
      <section className="rounded-[32px] bg-surface p-6 md:p-8"><div className="flex justify-between flex-wrap gap-3"><h2 className="display text-3xl">The next 7 market nights</h2><span className="text-muted">Click a bar to explore a night</span></div><div className="grid grid-cols-7 gap-2 md:gap-5 mt-8">{days.map((d, i) => <button key={d} onClick={() => setDate(d)} aria-pressed={date === d} aria-label={`${formatDay(d)}: ${counts[i]} bookings`} className="flex min-w-0 flex-col items-center gap-3 group cursor-pointer"><span className="text-sm font-semibold">{counts[i]}</span><span className="flex h-[220px] w-full items-end rounded-xl bg-night/50"><span className={`w-full rounded-xl transition-all group-hover:bg-glow ${date === d ? "bg-lantern" : "bg-sky"}`} style={{ height: `${Math.max(2, counts[i] / max * 220)}px` }} /></span><span className={`text-xs md:text-sm ${date === d ? "text-lantern" : "text-muted"}`}>{formatDay(d, "weekday")}<br />{formatDay(d, "day")}</span></button>)}</div></section>
      <ZoneBars spots={active} bookings={selected} day={date} />
      <section className="rounded-[32px] bg-surface p-6 md:p-8"><div className="flex justify-between gap-3 mb-5"><h2 className="display text-3xl">Latest bookings</h2><Link href="/bookings" className="text-sky">All bookings →</Link></div>{latest.length ? <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left"><thead className="text-sm text-muted"><tr>{["Vendor", "Spot", "Market night", "Product", "Pass"].map((x) => <th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{latest.map((b) => <tr key={b._id} className="border-t border-field"><td className="p-3">{b.user?.name ?? "Deleted user"}</td><td className="p-3 font-semibold">{b.spot?.spotNumber ?? "Removed"}</td><td className="p-3">{formatDay(dayKey(b.bookingDate), "short")}</td><td className="p-3">{b.productType}</td><td className="p-3"><Link href={`/bookings/${b._id}/pass`} className="btn btn-sm bg-lantern text-onlight">Pass</Link></td></tr>)}</tbody></table></div> : <p className="text-muted">No bookings yet.</p>}</section>
      <div className="flex gap-3"><Link href="/bookings" className="btn bg-lantern text-onlight">All bookings</Link><Link href="/admin/spots" className="btn bg-field">Manage spots</Link></div>
    </>}
  </div>;
}
