"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { baht, dayKey, formatDay, todayKey } from "@/lib/date";
import { useLoad } from "@/lib/hooks";
import type { Booking, Spot } from "@/lib/types";
import { ErrorBox, Loading, Modal, SummaryRows } from "../ui";
import SpotsAdmin from "./SpotsAdmin";
import { zoneLetter } from "@/lib/spots";
import styles from "../extras-styles";

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
  return <>
    <SpotsAdmin />
    <Modal open onClose={() => { if (!busy) router.push("/admin/spots"); }} width="max-w-[600px]">
    <div className="flex flex-col gap-5">
    {spots.loading || bookings.loading ? <Loading /> : spots.error ? <ErrorBox>{spots.error}</ErrorBox> : !spot ? <ErrorBox>This spot does not exist or was removed.</ErrorBox> : <>
      <h1 className={`display ${styles.deleteTitle}`}>Delete spot {spot.spotNumber}?</h1>
      <p className="text-lg text-muted">Vendors will no longer see {spot.spotNumber} on the map. This can’t be undone.</p>
      <SummaryRows rows={[["Spot", `${spot.spotNumber} · Zone ${zoneLetter(spot.zone)}`], ["Size", spot.spotSize], ["Location", spot.locationDescription], ["Rental fee", `${baht(spot.rentalFee)} per night`]]} />
      {bookings.error && <ErrorBox>Could not check upcoming bookings: {bookings.error}</ErrorBox>}
      {upcoming.length > 0 && <div className="rounded-2xl bg-danger-surface text-danger px-4 py-3.5">{upcoming.length} upcoming {upcoming.length === 1 ? "booking uses" : "bookings use"} {spot.spotNumber} ({upcoming.slice(0, 3).map((b) => formatDay(dayKey(b.bookingDate), "short")).join(", ")}). Existing bookings stay in the system; contact the vendors or move them first.</div>}
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className={styles.deleteActions}><button disabled={busy || !!bookings.error} onClick={remove} className="btn bg-danger text-onlight">{busy ? "Deleting…" : "Delete spot"}</button><Link href="/admin/spots" className="btn bg-field">Keep spot</Link></div>
    </>}
    </div>
    </Modal>
  </>;
}
