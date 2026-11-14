"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { baht, dayKey, formatDay, todayKey } from "@/lib/date";
import type { Booking, Spot } from "@/lib/types";
import Rules from "../Rules";
import { byNumber } from "../SpotMap";
import { ErrorBox, Field, Modal, SummaryRows } from "../ui";
import { PRODUCT_SUGGESTIONS, checkRules } from "./rules";

export function EditBookingModal({
  booking,
  spots,
  known,
  canSeeOthers,
  onClose,
  onSaved,
}: {
  booking: Booking | null;
  spots: Spot[];
  known: Booking[];
  canSeeOthers: boolean;
  onClose: () => void;
  onSaved: (b: Booking) => void;
}) {
  return (
    <Modal open={!!booking} onClose={onClose} width="max-w-4xl">
      {booking && <EditForm key={booking._id} {...{ booking, spots, known, canSeeOthers, onClose, onSaved }} />}
    </Modal>
  );
}

function EditForm({
  booking,
  spots,
  known,
  canSeeOthers,
  onClose,
  onSaved,
}: {
  booking: Booking;
  spots: Spot[];
  known: Booking[];
  canSeeOthers: boolean;
  onClose: () => void;
  onSaved: (b: Booking) => void;
}) {
  const [spotId, setSpotId] = useState(booking.spot?._id ?? "");
  const [date, setDate] = useState(dayKey(booking.bookingDate));
  const [product, setProduct] = useState(booking.productType);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const options = [...spots].sort((a, b) => a.zone.localeCompare(b.zone) || byNumber(a, b));
  const spot = options.find((s) => s._id === spotId) ?? booking.spot;
  const { rules } = checkRules({
    date,
    spotId,
    spotLabel: spot?.spotNumber,
    ownerId: booking.user?._id,
    known,
    excludeId: booking._id,
    canSeeOthers,
    serverError: error,
  });
  const changed = spotId !== booking.spot?._id || date !== dayKey(booking.bookingDate) || product.trim() !== booking.productType;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, string> = { bookingDate: date, productType: product.trim() };
      if (spotId !== booking.spot?._id) body.spot = spotId;
      onSaved(await api<Booking>(`/bookings/${booking._id}`, { method: "PUT", body }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t save the booking");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="display text-5xl">Edit booking</h2>
        {canSeeOthers && booking.user && (
          <p className="mt-2 text-muted">
            Vendor: {booking.user.name} · {booking.user.tel} · {booking.user.email}
          </p>
        )}
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="grid gap-7 md:grid-cols-[240px_1fr]">
        <div className="flex flex-col gap-2 rounded-[28px] bg-brand p-7">
          <p className="display text-[96px] leading-[0.9]">{spot?.spotNumber ?? "—"}</p>
          <p className="font-semibold">Zone {spot?.zone}</p>
          <p>{spot ? `${baht(spot.rentalFee)} / night` : ""}</p>
          <div className="mt-auto pt-6">
            <Rules rules={rules} />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Spot">
            <select className="input-base" value={spotId} onChange={(e) => setSpotId(e.target.value)}>
              {!options.some((s) => s._id === spotId) && booking.spot && (
                <option value={booking.spot._id}>{booking.spot.spotNumber} · Zone {booking.spot.zone} (no longer listed)</option>
              )}
              {options.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.spotNumber} · Zone {s.zone} · {baht(s.rentalFee)} per night
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Night"
            help={date !== dayKey(booking.bookingDate) ? `Changed from ${formatDay(dayKey(booking.bookingDate))}` : "Today or any later night"}
            error={date < todayKey() ? "Pick today or a later night" : null}
          >
            <input type="date" className="input-base" min={todayKey()} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={date < todayKey()} />
          </Field>
          <Field label="Product type">
            <input className="input-base" value={product} onChange={(e) => setProduct(e.target.value)} required />
          </Field>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_SUGGESTIONS.map((p) => (
              <button type="button" key={p} onClick={() => setProduct(p)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${product === p ? "bg-sky text-onlight" : "bg-field hover:bg-brand"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button disabled={busy || !changed || !product.trim()} className="btn bg-lantern text-onlight hover:bg-glow">
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={onClose} className="btn bg-field hover:bg-brand">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function DeleteBookingModal({
  booking,
  showVendor,
  onClose,
  onDeleted,
}: {
  booking: Booking | null;
  showVendor: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remove = async () => {
    if (!booking) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/bookings/${booking._id}`, { method: "DELETE" });
      onDeleted(booking._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t delete the booking");
    } finally {
      setBusy(false);
    }
  };
  const rows: [string, string][] = booking
    ? [
        ...(showVendor && booking.user ? ([["Vendor", booking.user.name]] as [string, string][]) : []),
        ["Spot", booking.spot ? `${booking.spot.spotNumber} · Zone ${booking.spot.zone}` : "Removed spot"],
        ["Night", formatDay(dayKey(booking.bookingDate))],
        ["Product type", booking.productType],
        ["Rental fee", booking.spot ? baht(booking.spot.rentalFee) : "—"],
      ]
    : [];
  return (
    <Modal open={!!booking} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <h2 className="display text-5xl">Delete this booking?</h2>
        <p className="text-lg text-muted">The spot will be released for other vendors. This can’t be undone.</p>
        {error && <ErrorBox>{error}</ErrorBox>}
        <SummaryRows rows={rows} />
        <div className="flex flex-wrap gap-3">
          <button onClick={remove} disabled={busy} className="btn bg-danger text-onlight">
            {busy ? "Deleting…" : "Delete booking"}
          </button>
          <button onClick={onClose} className="btn bg-field hover:bg-brand">
            Keep booking
          </button>
        </div>
      </div>
    </Modal>
  );
}
