"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { baht, dayKey, todayKey } from "@/lib/date";
import { useLoad } from "@/lib/hooks";
import type { Booking, Spot } from "@/lib/types";
import { byNumber } from "../SpotMap";
import { ErrorBox, Loading } from "../ui";

export default function SpotsAdmin() {
  const spots = useLoad(() => api<Spot[]>("/spots"));
  const bookings = useLoad(() => api<Booking[]>("/bookings"));
  const [zone, setZone] = useState("");
  const list = useMemo(() => [...(spots.data ?? [])].sort((a, b) => a.zone.localeCompare(b.zone) || byNumber(a, b)), [spots.data]);
  const zones = [...new Set(list.map((s) => s.zone))];
  const shown = list.filter((s) => !zone || s.zone === zone);
  const upcomingFor = (id: string) => (bookings.data ?? []).filter((b) => b.spot?._id === id && dayKey(b.bookingDate) >= todayKey());

  return (
    <div className="flex flex-col gap-7 px-5 pb-16 pt-6 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="display text-6xl md:text-[80px]">Manage spots</h1>
          <p className="text-lg text-muted">{list.length} spots in {zones.length} zones. Vendors see every spot listed here.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex w-[240px] flex-col gap-2">
            <span className="text-sm font-medium">Zone</span>
            <select className="input-base" value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">All zones</option>
              {zones.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </label>
          <Link href="/admin/spots/new" className="btn bg-lantern text-onlight hover:bg-glow">Add spot</Link>
        </div>
      </div>

      {spots.error && <ErrorBox>{spots.error}</ErrorBox>}
      {spots.loading && !spots.data ? (
        <Loading />
      ) : spots.error ? null : shown.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-[32px] bg-surface p-10">
          <p className="display text-3xl">No spots yet.</p>
          <Link href="/admin/spots/new" className="btn bg-lantern text-onlight hover:bg-glow">Add the first spot</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-y-1 text-left">
            <thead className="text-sm text-muted">
              <tr>
                {["Spot", "Zone", "Spot size", "Location description", "Rental fee", "Upcoming", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((s, i) => (
                <tr key={s._id} className={`[&>td:first-child]:rounded-l-xl [&>td:last-child]:rounded-r-xl ${i % 2 ? "" : "bg-surface"}`}>
                  <td className="px-4 py-3 font-semibold">{s.spotNumber}</td>
                  <td className="px-4 py-3">{s.zone}</td>
                  <td className="px-4 py-3">{s.spotSize}</td>
                  <td className="px-4 py-3">{s.locationDescription}</td>
                  <td className="px-4 py-3">{baht(s.rentalFee)} per night</td>
                  <td className="px-4 py-3">{bookings.data ? upcomingFor(s._id).length : "…"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/spots/${s._id}/edit`} className="btn btn-sm bg-field hover:bg-brand">Edit</Link>
                      <Link href={`/admin/spots/${s._id}/delete`} className="btn btn-sm bg-danger-surface text-danger hover:bg-danger hover:text-onlight">Delete</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


    </div>
  );
}
