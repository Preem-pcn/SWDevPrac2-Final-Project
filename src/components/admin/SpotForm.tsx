"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { baht } from "@/lib/date";
import { useLoad } from "@/lib/hooks";
import type { Spot } from "@/lib/types";
import { SpotTile, byNumber } from "../SpotMap";
import { ErrorBox, Field, Loading } from "../ui";
import styles from "../extras-styles";
import { zoneLetter } from "@/lib/spots";

const EMPTY = { spotNumber: "", zone: "", spotSize: "", locationDescription: "", rentalFee: "" };

export default function SpotForm({ id }: { id?: string }) {
  const router = useRouter();
  const spots = useLoad(() => api<Spot[]>("/spots"));
  const existing = id ? spots.data?.find((s) => s._id === id) : undefined;
  if (spots.loading && !spots.data) return <div className="px-10"><Loading /></div>;
  if (spots.error) return <div className="px-10 pt-6"><ErrorBox>{spots.error}</ErrorBox></div>;
  if (id && !existing) return <div className="px-10 pt-6"><ErrorBox>This spot doesn’t exist or was removed.</ErrorBox></div>;
  return <Form key={id ?? "new"} existing={existing} spots={spots.data ?? []} onDone={() => { router.push("/admin/spots"); router.refresh(); }} />;
}

function Form({ existing, spots, onDone }: { existing?: Spot; spots: Spot[]; onDone: () => void }) {
  const [v, setV] = useState(
    existing
      ? { ...existing, rentalFee: String(existing.rentalFee) }
      : EMPTY,
  );
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const zones = useMemo(() => [...new Set(spots.map((s) => s.zone))].sort(), [spots]);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });
  const fee = Number(v.rentalFee);
  const errs = {
    spotNumber: !v.spotNumber.trim() ? "Enter a spot number" : null,
    zone: !v.zone.trim() ? "Enter a zone" : null,
    spotSize: !v.spotSize.trim() ? "Enter a size, like 2 x 3 m" : null,
    locationDescription: !v.locationDescription.trim() ? "Describe where the spot is" : null,
    rentalFee: v.rentalFee === "" || !Number.isFinite(fee) || fee < 0 ? "Enter a fee of 0 or more" : null,
  };
  const duplicate = spots.find((s) => s._id !== existing?._id && s.zone.trim() === v.zone.trim() && s.spotNumber.trim().toLowerCase() === v.spotNumber.trim().toLowerCase());
  const invalid = Object.values(errs).some(Boolean);
  const zoneMates = [...spots.filter((s) => s.zone === v.zone && s._id !== existing?._id)].sort(byNumber);
  const preview: Spot = { _id: "preview", spotNumber: v.spotNumber || "—", zone: v.zone, spotSize: v.spotSize, locationDescription: v.locationDescription, rentalFee: fee || 0 };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    setBusy(true);
    setError(null);
    const body = {
      spotNumber: v.spotNumber.trim(),
      zone: v.zone.trim(),
      spotSize: v.spotSize.trim(),
      locationDescription: v.locationDescription.trim(),
      rentalFee: fee,
    };
    try {
      if (existing) await api(`/spots/${existing._id}`, { method: "PUT", body });
      else await api("/spots", { method: "POST", body });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t save the spot");
      setBusy(false);
    }
  };
  const err = (k: keyof typeof errs) => (touched ? errs[k] : null);

  return (
    <div className={`grid gap-6 px-3 pb-6 md:px-6 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[1fr_minmax(0,40%)] ${existing ? styles.editPage : ""}`}>
      <form onSubmit={submit} className="flex flex-col justify-center px-3 py-10 md:px-16" noValidate>
        <div className="flex w-full max-w-[560px] flex-col gap-[18px]">
          <h1 className="display text-5xl">{existing ? `Edit spot ${existing.spotNumber}` : "Add a spot"}</h1>
          {error && <ErrorBox>{error}</ErrorBox>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Spot number" error={err("spotNumber")} help={duplicate ? `${duplicate.spotNumber} already exists in this zone` : undefined}>
              <input className="input-base" value={v.spotNumber} onChange={set("spotNumber")} placeholder="A13" aria-invalid={!!err("spotNumber")} />
            </Field>
            <Field label="Zone" error={err("zone")}>
              {existing ? <select className="input-base" value={v.zone} onChange={(e) => setV({ ...v, zone: e.target.value })} aria-invalid={!!err("zone")}>{zones.map((z) => <option key={z} value={z}>{z}</option>)}</select> : <input className="input-base" list="zones" value={v.zone} onChange={set("zone")} placeholder="A · Food street" aria-invalid={!!err("zone")} />}
              <datalist id="zones">{zones.map((z) => <option key={z} value={z} />)}</datalist>
            </Field>
          </div>
          <Field label="Spot size" error={err("spotSize")} help={existing ? "Width × depth in metres" : "Width × depth, like 2 x 3 m"}>
            <input className="input-base" value={v.spotSize} onChange={set("spotSize")} aria-invalid={!!err("spotSize")} />
          </Field>
          <Field label="Location description" error={err("locationDescription")}>
            <input className="input-base" value={v.locationDescription} onChange={set("locationDescription")} aria-invalid={!!err("locationDescription")} placeholder="Last stall on the left, next to the exit gate" />
          </Field>
          <Field label="Rental fee" error={err("rentalFee")} help={existing && fee !== existing.rentalFee ? `Baht per night · changed from ${existing.rentalFee}` : "Baht per night"}>
            <input className="input-base" type="number" min={0} inputMode="numeric" value={v.rentalFee} onChange={set("rentalFee")} aria-invalid={!!err("rentalFee")} />
          </Field>
          <div className="flex flex-wrap gap-3 pt-1">
            <button disabled={busy} className="btn bg-lantern text-onlight hover:bg-glow">{busy ? "Saving…" : existing ? "Save changes" : "Create spot"}</button>
            <Link href="/admin/spots" className="btn bg-field hover:bg-brand">Cancel</Link>
            {existing && <Link href={`/admin/spots/${existing._id}/delete`} className="btn ml-auto bg-danger text-onlight hover:bg-glow">Delete spot</Link>}
          </div>
        </div>
      </form>
      <aside className="flex flex-col gap-6 rounded-[40px] bg-brand p-10">
        <p className="text-lg">How vendors will see it</p>
        <p className="display break-all text-[160px] leading-[0.9]">{preview.spotNumber}</p>
        {[
          ["Zone", v.zone || "—"],
          ["Spot size", v.spotSize || "—"],
          ["Location", v.locationDescription || "—"],
          ["Rental fee", v.rentalFee === "" ? "—" : `${baht(fee || 0)} per night`],
        ].map(([k, val]) => (
          <div key={k}>
            <p className="text-sm font-medium">{k}</p>
            <p className="text-xl font-semibold">{val}</p>
          </div>
        ))}
        {v.zone && (
          <div className="mt-auto flex flex-col gap-2.5 rounded-[28px] bg-night p-5">
            <p className="text-sm font-medium text-muted">Zone {existing ? zoneLetter(v.zone) : v.zone} · {zoneMates.length + 1} spots</p>
            <div className="flex flex-wrap gap-2">
              {[...zoneMates, preview].sort(byNumber).map((s) => (
                <SpotTile key={s._id} spot={s} size={existing ? 52 : 48} state={s._id === "preview" ? "selected" : "available"} />
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
