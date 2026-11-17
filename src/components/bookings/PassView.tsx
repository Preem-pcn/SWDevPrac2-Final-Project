"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { api } from "@/lib/api";
import { dayKey, formatDay, marketOpensAt, todayKey } from "@/lib/date";
import { useLoad } from "@/lib/hooks";
import type { Booking } from "@/lib/types";
import { ErrorBox, Loading } from "../ui";
import Lanterns from "../Lanterns";
import styles from "../extras-styles";

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
    if (b) QRCode.toDataURL(`SAENGDAO NIGHT MARKET|BOOKING ${b._id}|SPOT ${b.spot?.spotNumber ?? "Removed"}|NIGHT ${dayKey(b.bookingDate)}|VENDOR ${b.user?.name ?? "Deleted user"}`, { width: 480, margin: 0, errorCorrectionLevel: "M", color: { dark: "#04263d", light: "#f3f9fd" } })
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
      const png = await toPng(ticket.current, { pixelRatio: 3, backgroundColor: "#006199" });
      const name = `saengdao-${b.spot?.spotNumber ?? "spot"}-${dayKey(b.bookingDate)}`;
      if (format === "png") {
        const link = document.createElement("a"); link.href = png; link.download = `${name}.png`; link.click();
      } else {
        const { jsPDF } = await import("jspdf");
        const { offsetWidth: w, offsetHeight: h } = ticket.current;
        const pdf = new jsPDF({ compress: true, unit: "px", format: [w, h], orientation: h >= w ? "portrait" : "landscape", hotfixes: ["px_scaling"] });
        pdf.addImage(png, "PNG", 0, 0, w, h, undefined, "FAST"); pdf.save(`${name}.pdf`);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not download pass."); }
    finally { setBusy(false); }
  };
  if (booking.loading) return <div className="p-10"><Loading /></div>;
  if (booking.error || !b) return <div className="p-10"><ErrorBox>{booking.error ?? "Booking not found."}</ErrorBox><Link href="/bookings" className="btn bg-field mt-5">Back to bookings</Link></div>;
  const day = dayKey(b.bookingDate);
  const seconds = now === null ? null : Math.max(0, Math.floor((marketOpensAt(day).getTime() - now) / 1000));
  const otherPasses = (others.data ?? []).filter((x) => x._id !== id && x.user?._id === b.user?._id && dayKey(x.bookingDate) >= todayKey());
  return (
    <div className={styles.passPage}>
      <section className={styles.passStage} aria-label="Vendor ticket">
        <Lanterns className={styles.lanterns} depth={90} />
        <div ref={ticket} className={styles.ticket}>
          <div className={styles.ticketTop}>
            <div className={styles.ticketBrand}><strong>Saengdao Night Market</strong><span>Vendor pass</span></div>
            <p className={`display ${styles.ticketNumber}`}>{b.spot?.spotNumber ?? "—"}</p>
            <p className={styles.ticketZone}>Zone {b.spot?.zone ?? "—"} · {b.spot?.spotSize ?? "—"}</p>
          </div>
          <div className={styles.perforation}><span /></div>
          <div className={styles.ticketBottom}>
            <dl className={styles.ticketDetails}>
              {[["Night", formatDay(day).replace(",", "")], ["Opens", "17:00"], ["Vendor", b.user?.name ?? "Deleted user"], ["Selling", b.productType]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            {b.spot?.isActive === false && <p className="text-danger-surface mt-3">Spot removed. Contact the market before arriving.</p>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr ? <img src={qr} alt="Scannable QR code containing booking details" width={184} height={184} className={styles.qr} /> : <p className="py-10 text-center">Generating QR code…</p>}
            <p className={styles.ticketFooter}>Booking {b._id} · show this at the gate</p>
          </div>
        </div>
      </section>
      <section className={styles.passInfo}>
        <h1 className={`display ${styles.passTitle}`}>Your vendor pass</h1>
        <p className={styles.intro}>Show it at the market office when you arrive. Download it now so it works without signal.</p>
        <div className={styles.countdown}>
          <p>{day < todayKey() ? "This market night has passed" : seconds === 0 ? "Market opening time has arrived" : "Your stall opens in"}</p>
          <div className={styles.countdownUnits}>
            {[[seconds === null ? "—" : Math.floor(seconds / 86400), "days"], [seconds === null ? "—" : Math.floor(seconds / 3600) % 24, "hours"], [seconds === null ? "—" : Math.floor(seconds / 60) % 60, "minutes"]].map(([value, label]) => <span key={label}><strong className="display tabular-nums">{value}</strong><span>{label}</span></span>)}
          </div>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <div className={styles.passActions}>
          <button disabled={busy || !qr} onClick={() => download("png")} className="btn bg-lantern text-onlight hover:bg-glow">{busy ? "Preparing…" : "Download PNG"}</button>
          <button disabled={busy || !qr} onClick={() => download("pdf")} className="btn bg-field hover:bg-brand">Download PDF</button>
          <Link href="/bookings" className="btn bg-field hover:bg-brand">Back to My bookings</Link>
        </div>
        <ul className={styles.passNotes}>
          <li>Valid only for spot {b.spot?.spotNumber ?? "—"} on {formatDay(day).replace(",", "")}</li>
          <li>Set-up opens at 15:00, two hours before the market</li>
          <li>If you edit this booking, download the new pass</li>
        </ul>
        <div className={styles.otherPasses}>
          <h2 className="display">Your other passes</h2>
          {others.error && <ErrorBox>{others.error}</ErrorBox>}
          <div className={styles.otherGrid}>{otherPasses.map((x) => <Link key={x._id} href={`/bookings/${x._id}/pass`} className={styles.otherCard}>
            <span>{x.spot?.spotNumber ?? "—"}</span><span><strong>{formatDay(dayKey(x.bookingDate), "short")}</strong><small>Zone {x.spot?.zone?.split(" · ")[0] ?? "—"}</small></span>
          </Link>)}</div>
          {!others.loading && !otherPasses.length && <p className="text-muted">No other upcoming passes.</p>}
        </div>
      </section>
    </div>
  );
}
