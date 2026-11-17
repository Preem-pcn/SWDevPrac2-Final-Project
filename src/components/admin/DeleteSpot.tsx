"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { baht, dayKey, formatDay, todayKey } from "@/lib/date";
import { useLoad } from "@/lib/hooks";
import type { Booking, Spot } from "@/lib/types";
import { ErrorBox, Loading, SummaryRows } from "../ui";

export default function DeleteSpot({ id }: { id: string }) {
  const router = useRouter();
  const spots = useLoad(() => api<Spot[]>("/spots"));
  const bookings = useLoad(() => api<Booking[]>("/bookings"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const spot = spots.data?.find((s) => s._id === id);
  const upcoming = (bookings.data ?? []).filter((b) => b.spot?._id === id && dayKey(b.bookingDate) >= todayKey());
  const remove = async () => {
    setBusy(true); setError(null);
    try { await api(`/spots/${id}`, { method: "DELETE" }); router.push("/admin/spots"); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not delete this spot."); setBusy(false); }
  };
  return <div className="px-5 py-8 md:px-10 max-w-4xl mx-auto flex flex-col gap-6">
    <Link href="/admin/spots" className="text-sky">← Manage spots</Link>
    {spots.loading || bookings.loading ? <Loading /> : spots.error ? <ErrorBox>{spots.error}</ErrorBox> : !spot ? <ErrorBox>This spot does not exist or was removed.</ErrorBox> : <>
      <h1 className="display text-5xl md:text-7xl">Delete spot {spot.spotNumber}?</h1>
      <p className="text-lg text-muted">Vendors will no longer see this spot on the map or be able to book it. Existing bookings remain in the system.</p>
      <div className="rounded-[32px] bg-surface p-7"><SummaryRows rows={[["Spot", `${spot.spotNumber} · Zone ${spot.zone}`], ["Size", spot.spotSize], ["Location", spot.locationDescription], ["Rental fee", `${baht(spot.rentalFee)} per night`]]} /></div>
      {bookings.error && <ErrorBox>Could not check upcoming bookings: {bookings.error}</ErrorBox>}
      {upcoming.length > 0 && <div className="rounded-2xl bg-danger-surface text-danger p-5">{upcoming.length} upcoming bookings use this spot. They still count toward each vendor’s daily limit. Contact the vendors or move their bookings first.<ul className="mt-3 list-disc pl-5">{upcoming.map((b) => <li key={b._id}><Link href={`/bookings/${b._id}/pass`} className="underline">{formatDay(dayKey(b.bookingDate))} · {b.user?.name ?? "Deleted user"}</Link></li>)}</ul></div>}
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="flex gap-3"><button disabled={busy || !!bookings.error} onClick={remove} className="btn bg-danger text-onlight">{busy ? "Deleting…" : "Delete spot"}</button><Link href="/admin/spots" className="btn bg-field">Keep spot</Link></div>
    </>}
  </div>;
}
