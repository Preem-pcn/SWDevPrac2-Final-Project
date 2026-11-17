"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { api } from "@/lib/api";
import { baht, dayKey, formatDay, marketOpensAt, todayKey } from "@/lib/date";
import { useLoad } from "@/lib/hooks";
import type { Booking } from "@/lib/types";
import { ErrorBox, Loading } from "../ui";

export default function PassView({ id }: { id: string }) {
  const booking = useLoad(() => api<Booking>(`/bookings/${id}`), [id]);
  const others = useLoad(() => api<Booking[]>("/bookings"));
  const ticket = useRef<HTMLDivElement>(null);
  const [qr, setQr] = useState("");
  const [now, setNow] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const b = booking.data;
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    if (b) QRCode.toDataURL(`SAENGDAO NIGHT MARKET|BOOKING ${b._id}|SPOT ${b.spot?.spotNumber ?? "Removed"}|NIGHT ${dayKey(b.bookingDate)}|VENDOR ${b.user?.name ?? "Deleted user"}`, { width: 480, margin: 4, errorCorrectionLevel: "M" })
      .then((url) => { if (active) setQr(url); })
      .catch(() => { if (active) setError("Could not generate QR code. Please reload."); });
    return () => { active = false; };
  }, [b]);
  const download = async (format: "png" | "pdf") => {
    if (!ticket.current || !b || !qr) return;
    setBusy(true); setError(null);
    try {
      await document.fonts.ready;
      const { toPng } = await import("html-to-image");
      const png = await toPng(ticket.current, { pixelRatio: 3, backgroundColor: "#04263d" });
      const name = `saengdao-${b.spot?.spotNumber ?? "spot"}-${dayKey(b.bookingDate)}`;
      if (format === "png") {
        const link = document.createElement("a"); link.href = png; link.download = `${name}.png`; link.click();
      } else {
        const { jsPDF } = await import("jspdf");
        const { offsetWidth: w, offsetHeight: h } = ticket.current;
        const pdf = new jsPDF({ unit: "px", format: [w, h], orientation: h >= w ? "portrait" : "landscape", hotfixes: ["px_scaling"] });
        pdf.addImage(png, "PNG", 0, 0, w, h); pdf.save(`${name}.pdf`);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not download pass."); }
    finally { setBusy(false); }
  };
  if (booking.loading) return <div className="p-10"><Loading /></div>;
  if (booking.error || !b) return <div className="p-10"><ErrorBox>{booking.error ?? "Booking not found."}</ErrorBox><Link href="/bookings" className="btn bg-field mt-5">Back to bookings</Link></div>;
  const day = dayKey(b.bookingDate);
  const seconds = now === null ? null : Math.max(0, Math.floor((marketOpensAt(day).getTime() - now) / 1000));
  const otherPasses = (others.data ?? []).filter((x) => x._id !== id && x.user?._id === b.user?._id && dayKey(x.bookingDate) >= todayKey());
  return <div className="px-5 py-6 md:px-10 pb-16">
    <Link href="/bookings" className="text-sky">← My bookings</Link>
    <h1 className="display text-5xl md:text-7xl mt-5 mb-8">Your market pass</h1>
    <div className="grid gap-10 lg:grid-cols-[minmax(0,540px)_1fr]">
      <div ref={ticket} className="overflow-hidden rounded-[32px]">
        <div className="bg-lantern text-onlight p-8 md:p-10">
          <p className="font-semibold tracking-widest">SAENGDAO · NIGHT MARKET</p>
          <p className="mt-8 text-sm uppercase tracking-widest">Vendor entry pass · Spot</p>
          <p className="display break-all text-[clamp(5rem,15vw,9rem)] my-2">{b.spot?.spotNumber ?? "—"}</p>
          <p className="text-xl font-semibold">Zone {b.spot?.zone ?? "—"} · {b.spot?.spotSize ?? "—"}</p>
        </div>
        <div className="relative bg-surface px-8 md:px-10">
          <div className="border-t-2 border-dashed border-muted" />
          <span className="absolute -left-4 -top-4 size-8 rounded-full bg-night" />
          <span className="absolute -right-4 -top-4 size-8 rounded-full bg-night" />
        </div>
        <div className="bg-surface p-8 md:p-10 flex flex-col gap-5">
          <p className="display text-3xl">{formatDay(day)}</p><p className="text-sky">Market opens 17:00 · Bangkok time</p>
          {[["Vendor", b.user?.name ?? "Deleted user"], ["Product", b.productType], ["Location", b.spot?.locationDescription ?? "Spot removed"], ["Rental fee", b.spot ? `${baht(b.spot.rentalFee)} / night` : "—"]].map(([label, value]) => <div key={label}><p className="text-sm text-muted">{label}</p><p className="font-semibold break-words">{value}</p></div>)}
          {b.spot?.isActive === false && <p className="text-danger">This spot was removed. Contact the market before arriving.</p>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt="Scannable QR code containing booking details" width={240} height={240} className="self-center rounded-xl" /> : <p>Generating QR code…</p>}
          <p className="text-center text-xs text-muted break-all">Booking {b._id}</p>
        </div>
      </div>
      <aside className="flex flex-col gap-6 lg:pt-4">
        <div className="rounded-[32px] bg-surface p-7">
          <p className="text-muted">{day < todayKey() ? "This market night has passed" : seconds === 0 ? "Market opening time has arrived" : "Until the market opens"}</p>
          <p className="display text-4xl mt-4 tabular-nums">{seconds === null ? "Loading…" : seconds === 0 ? "17:00" : `${Math.floor(seconds / 86400)}d ${String(Math.floor(seconds / 3600) % 24).padStart(2, "0")}h ${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}m ${String(seconds % 60).padStart(2, "0")}s`}</p>
          <p className="text-muted mt-4">Show this pass at the entrance. Save a copy for offline access.</p>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <div className="flex flex-wrap gap-3"><button disabled={busy || !qr} onClick={() => download("png")} className="btn bg-lantern text-onlight">{busy ? "Preparing…" : "Download PNG"}</button><button disabled={busy || !qr} onClick={() => download("pdf")} className="btn bg-field">Download PDF</button></div>
        <h2 className="display text-2xl mt-3">Your other passes</h2>
        {others.error && <ErrorBox>{others.error}</ErrorBox>}
        {otherPasses.map((x) => <Link key={x._id} href={`/bookings/${x._id}/pass`} className="rounded-2xl bg-surface p-5 flex justify-between gap-3"><span className="font-semibold">{x.spot?.spotNumber ?? "Removed spot"}</span><span>{formatDay(dayKey(x.bookingDate), "short")} →</span></Link>)}
        {!others.loading && !otherPasses.length && <p className="text-muted">No other upcoming passes.</p>}
      </aside>
    </div>
  </div>;
}
