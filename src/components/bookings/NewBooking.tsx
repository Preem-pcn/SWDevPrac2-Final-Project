"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { baht, dayKey, formatDay, todayKey } from "@/lib/date";
import { useLoad } from "@/lib/hooks";
import type { Booking, Spot } from "@/lib/types";
import Rules from "../Rules";
import { SpotMap, SpotTile, byNumber, groupByZone } from "../SpotMap";
import { useSession } from "../session";
import { ErrorBox, Field, Loading } from "../ui";
import { PRODUCT_SUGGESTIONS, checkRules } from "./rules";

export default function NewBooking({ initialSpot, initialDate }: { initialSpot?: string; initialDate?: string }) {
  const user = useSession();
  const router = useRouter();
  const spots = useLoad(() => api<Spot[]>("/spots"));
  const mine = useLoad(() => api<Booking[]>("/bookings"));
  const [spotId, setSpotId] = useState(initialSpot ?? "");
  const [date, setDate] = useState(initialDate ?? todayKey());
  const [product, setProduct] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => groupByZone(spots.data ?? []).flatMap(([, l]) => l), [spots.data]);
  const spot = list.find((s) => s._id === spotId) ?? null;
  const zoneSpots = spot ? list.filter((s) => s.zone === spot.zone).sort(byNumber) : [];
  const own = mine.data ?? [];
  const ownOnDate = own.filter((b) => dayKey(b.bookingDate) === date && b.spot);
  const { rules, ownCount } = checkRules({
    date,
    spotId,
    spotLabel: spot?.spotNumber,
    ownerId: user?.id,
    known: own,
    canSeeOthers: false,
    serverError: error,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spot) return setError("Pick a spot first.");
    if (!product.trim()) return setError("Tell other vendors what you’ll sell.");
    setBusy(true);
    setError(null);
    try {
      const b = await api<Booking>("/bookings", { method: "POST", body: { spot: spot._id, bookingDate: date, productType: product.trim() } });
      router.push(`/bookings?created=${b._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
      setBusy(false);
    }
  };

  const loadError = spots.error ?? mine.error;
  const pick = (id: string) => {
    setSpotId(id);
    setError(null);
  };

  if (spots.loading && !spots.data) return <div className="px-10"><Loading label="Loading spots…" /></div>;

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 px-3 pb-6 pt-2 md:px-6 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[400px_1fr_340px]">
      {/* Spot summary */}
      <section className="flex flex-col gap-5 rounded-[40px] bg-brand p-8 md:p-10">
        {loadError ? (
          <div className="flex flex-col gap-5">
            <p className="display text-4xl">Couldn’t load the spots</p>
            <ErrorBox>{loadError}</ErrorBox>
            <button type="button" onClick={() => { spots.reload(); mine.reload(); }} className="btn self-start bg-lantern text-onlight hover:bg-glow">
              Try again
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col gap-4">
            <p className="display text-4xl">No spots yet</p>
            <p className="text-lg">An admin needs to add spots before anyone can book.</p>
          </div>
        ) : spot ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className="text-lg font-medium">Zone {spot.zone}</p>
              <button type="button" onClick={() => pick("")} className="btn btn-sm bg-night/40 hover:bg-night/60">
                Change spot
              </button>
            </div>
            <p className="display text-[150px] leading-[0.9]">{spot.spotNumber}</p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium">Size</p>
                <p className="display text-2xl">{spot.spotSize}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Fee</p>
                <p className="display text-2xl">{baht(spot.rentalFee)} / night</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-lg font-semibold">{spot.locationDescription}</p>
            </div>
            <div className="mt-auto flex flex-col gap-2.5 rounded-[28px] bg-night p-5">
              <p className="text-sm font-medium text-muted">Other spots in zone {spot.zone}</p>
              <div className="flex flex-wrap gap-2">
                {zoneSpots.map((s) => (
                  <SpotTile
                    key={s._id}
                    spot={s}
                    size={48}
                    state={s._id === spot._id ? "selected" : ownOnDate.some((b) => b.spot!._id === s._id) ? "mine" : "available"}
                    onClick={() => pick(s._id)}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <p className="display text-5xl">Pick a spot</p>
              <p className="text-lg">Tap a stall on the map, or choose one from the list.</p>
            </div>
            <div className="rounded-[28px] bg-night p-5">
              <SpotMap
                spots={list}
                size={48}
                stateOf={(s) => (ownOnDate.some((b) => b.spot!._id === s._id) ? "mine" : "available")}
                onSelect={(s) => pick(s._id)}
              />
            </div>
          </>
        )}
      </section>

      {/* Form */}
      <section className="flex flex-col gap-5 rounded-[40px] bg-surface p-8 md:px-14 md:py-12">
        <h1 className="display text-5xl md:text-[56px]">Book this spot</h1>
        {error ? <ErrorBox>{error}</ErrorBox> : <p className="text-lg text-muted">Choose the night and tell other vendors what you’ll sell.</p>}
        <Field label="Spot">
          <select className="input-base" value={spotId} onChange={(e) => pick(e.target.value)} required>
            <option value="" disabled>{list.length ? `Choose a spot (${list.length} available)` : "No spots to choose from"}</option>
            {list.map((s) => (
              <option key={s._id} value={s._id}>
                {s.spotNumber} · Zone {s.zone} · {baht(s.rentalFee)} per night
              </option>
            ))}
          </select>
        </Field>
        <Field label="Night you need the spot" help="Today or any later night" error={date && date < todayKey() ? "This night has passed. Pick today or a later date." : null}>
          <input type="date" className="input-base" min={todayKey()} value={date} onChange={(e) => { setDate(e.target.value); setError(null); }} aria-invalid={date < todayKey()} required />
        </Field>
        <Field label="Product type">
          <input className="input-base" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="What will you sell?" required />
        </Field>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_SUGGESTIONS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setProduct(p)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${product === p ? "bg-sky text-onlight" : "bg-field hover:bg-brand"}`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-4 rounded-[20px] bg-night px-5 py-4">
          <div className="flex-1">
            <p className="text-sm text-muted">{spot && date ? `Total for ${formatDay(date, "short")}` : "Total"}</p>
            <p className="font-semibold">Pay at the market office before 17:00 on the night</p>
          </div>
          <p className="display text-4xl text-lantern">{spot ? baht(spot.rentalFee) : "—"}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button disabled={busy || !spot} className="btn bg-lantern text-onlight hover:bg-glow">
            {busy ? "Booking…" : spot ? `Confirm ${spot.spotNumber}` : "Pick a spot first"}
          </button>
          <Link href={`/spots?date=${date}${spotId ? `&spot=${spotId}` : ""}`} className="btn bg-field hover:bg-brand">
            Back to spots
          </Link>
        </div>
      </section>

      {/* Night at a glance */}
      <aside className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-[40px] bg-lantern p-8 text-onlight">
          <p className="text-lg font-semibold">{date ? formatDay(date, "short") : "Pick a night"}</p>
          <p className="flex items-end gap-2">
            <span className="display text-8xl">{ownCount}</span>
            <span className="pb-2 text-xl font-semibold">of 3 spots used</span>
          </p>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-3 flex-1 rounded-full ${i < ownCount ? "bg-onlight" : "bg-onlight/15"}`} />
            ))}
          </div>
          {ownOnDate.length > 0 && (
            <p>Already booked {ownOnDate.map((b) => b.spot!.spotNumber).join(", ")} that night</p>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-5 rounded-[40px] bg-surface p-8">
          <h2 className="display text-2xl">Booking rules</h2>
          <Rules rules={rules} />
        </div>
      </aside>
    </form>
  );
}
