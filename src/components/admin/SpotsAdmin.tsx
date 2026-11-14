"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { baht, dayKey, formatDay, todayKey } from "@/lib/date";
import { useLoad } from "@/lib/hooks";
import type { Booking, Spot } from "@/lib/types";
import { byNumber } from "../SpotMap";
import { ErrorBox, Loading, Modal, Notice, SummaryRows } from "../ui";

export default function SpotsAdmin() {
  const spots = useLoad(() => api<Spot[]>("/spots"));
  const bookings = useLoad(() => api<Booking[]>("/bookings"));
  const [deleting, setDeleting] = useState<Spot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [zone, setZone] = useState("");
  const list = useMemo(() => [...(spots.data ?? [])].sort((a, b) => a.zone.localeCompare(b.zone) || byNumber(a, b)), [spots.data]);
  const zones = [...new Set(list.map((s) => s.zone))];
  const shown = list.filter((s) => !zone || s.zone === zone);
  const upcomingFor = (id: string) => (bookings.data ?? []).filter((b) => b.spot?._id === id && dayKey(b.bookingDate) >= todayKey());

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/spots/${deleting._id}`, { method: "DELETE" });
      spots.setData(list.filter((s) => s._id !== deleting._id));
      setNotice(`Removed spot ${deleting.spotNumber}. Vendors no longer see it on the map.`);
      setDeleting(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t delete the spot");
    } finally {
      setBusy(false);
    }
  };

  const upcoming = deleting ? upcomingFor(deleting._id) : [];

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
      {notice && <Notice>{notice}</Notice>}
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
                      <button onClick={() => { setError(null); setDeleting(s); }} className="btn btn-sm bg-danger-surface text-danger hover:bg-danger hover:text-onlight">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)}>
        {deleting && (
          <div className="flex flex-col gap-5">
            <h2 className="display text-5xl">Delete spot {deleting.spotNumber}?</h2>
            <p className="text-lg text-muted">Vendors will no longer see {deleting.spotNumber} on the map or be able to book it.</p>
            {error && <ErrorBox>{error}</ErrorBox>}
            <SummaryRows
              rows={[
                ["Spot", `${deleting.spotNumber} · Zone ${deleting.zone}`],
                ["Size", deleting.spotSize],
                ["Location", deleting.locationDescription],
                ["Rental fee", `${baht(deleting.rentalFee)} per night`],
              ]}
            />
            {upcoming.length > 0 && (
              <div className="rounded-2xl bg-danger-surface px-4 py-3.5 font-medium text-danger">
                {upcoming.length} upcoming {upcoming.length === 1 ? "booking uses" : "bookings use"} this spot (
                {upcoming.slice(0, 3).map((b) => formatDay(dayKey(b.bookingDate), "short")).join(", ")}). They stay in the system and still count toward each vendor’s daily limit, so contact or move them first.
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button onClick={remove} disabled={busy} className="btn bg-danger text-onlight">{busy ? "Deleting…" : "Delete spot"}</button>
              <button onClick={() => setDeleting(null)} className="btn bg-field hover:bg-brand">Keep spot</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
