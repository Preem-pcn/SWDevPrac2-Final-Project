"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { addDays, baht, dayKey, formatDay, keyToDate, todayKey } from "@/lib/date";
import { useLoad } from "@/lib/hooks";
import type { Booking, Spot } from "@/lib/types";
import { ErrorBox, Loading } from "../ui";
import styles from "../extras-styles";

export default function Dashboard() {
  const bookings = useLoad(() => api<Booking[]>("/bookings"));
  const spots = useLoad(() => api<Spot[]>("/spots"));
  const [date, setDate] = useState(todayKey);
  const [anchor, setAnchor] = useState(todayKey);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);
  const all = bookings.data ?? [];
  const active = (spots.data ?? []).filter((s) => s.isActive !== false);
  const selected = all.filter((b) => dayKey(b.bookingDate) === date);
  const occupied = new Set(selected.filter((b) => active.some((s) => s._id === b.spot?._id)).map((b) => b.spot!._id)).size;
  const days = Array.from({ length: 7 }, (_, i) => addDays(anchor, i));
  const counts = days.map((d) => all.filter((b) => dayKey(b.bookingDate) === d).length);
  const zones = [...new Set(active.map((s) => s.zone))].sort();
  const latest = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const fullDate = keyToDate(date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const age = (createdAt: string) => {
    if (now === null) return "Recently booked";
    const minutes = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
    return minutes < 1 ? "Just now" : minutes < 60 ? `${minutes} min ago` : minutes < 1440 ? `${Math.floor(minutes / 60)} h ago` : `${Math.floor(minutes / 1440)} days ago`;
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <div><h1 className="display">Tonight at Saengdao</h1><p className={styles.intro}>{fullDate} · market opens at 17:00</p></div>
        <label>Market date<div className="extras-dateField"><span aria-hidden="true">{formatDay(date).replace(",", "")}</span><span aria-hidden="true">?</span><input type="date" className="input-base" value={date} onClick={(e) => e.currentTarget.showPicker?.()} onChange={(e) => { if (e.target.value) { setDate(e.target.value); setAnchor(e.target.value); } }} /></div></label>
      </div>
      {(bookings.error || spots.error) && <ErrorBox>{bookings.error || spots.error}</ErrorBox>}
      {bookings.loading || spots.loading ? <Loading /> : bookings.error || spots.error ? null : <>
        <div className={styles.stats}>
          {[[String(selected.length), "bookings tonight"], [String(Math.max(0, active.length - occupied)), `of ${active.length} spots still free`], [String(new Set(selected.flatMap((b) => b.user ? [b.user._id] : [])).size), "vendors selling tonight"], [baht(selected.reduce((sum, b) => sum + (b.spot?.rentalFee ?? 0), 0)), "rent due tonight"]].map(([value, label]) => <div key={label} className={styles.stat}><strong className="display">{value}</strong><p>{label}</p></div>)}
        </div>
        <div className={styles.dashboardGrid}>
          <section className={styles.chart}>
            <h2 className="display">Next 7 nights</h2><p>Spots booked each night, out of {active.length}</p>
            <div className={styles.bars}>{days.map((d, i) => <button key={d} onClick={() => setDate(d)} aria-pressed={date === d} aria-label={`${formatDay(d)}: ${counts[i]} bookings`} className={`${styles.barButton} ${date === d ? styles.barSelected : ""}`}>
              <strong className={`display ${styles.barCount}`}>{counts[i]}</strong>
              <span className={styles.bar} style={{ height: `${Math.max(2, counts[i] / Math.max(18, ...counts) * 432)}px` }} />
              <span className={styles.barLabel}>{formatDay(d, "weekday")} {formatDay(d, "day")}</span>
            </button>)}</div>
          </section>
          <aside className={styles.dashboardAside}>
            <section className={styles.zones}>
              <h2 className="display">Zones tonight</h2>
              {zones.map((zone) => {
                const zoneSpots = active.filter((s) => s.zone === zone);
                const booked = new Set(selected.filter((b) => zoneSpots.some((s) => s._id === b.spot?._id)).map((b) => b.spot!._id)).size;
                return <div className={styles.zone} key={zone}><div><strong>Zone {zone}</strong><span>{booked} of {zoneSpots.length}</span></div><div className={styles.track}><div style={{ width: `${zoneSpots.length ? booked / zoneSpots.length * 100 : 0}%` }} /></div></div>;
              })}
              {!zones.length && <p className="text-muted">No active spots yet.</p>}
            </section>
            <section className={styles.latest}>
              <h2 className="display">Latest bookings</h2>
              <div className={styles.latestList}>{latest.map((b) => <Link key={b._id} href={`/bookings/${b._id}/pass`} className={styles.latestItem}>
                <span>{b.spot?.spotNumber ?? "—"}</span><span><strong>{b.user?.name ?? "Deleted user"} · {b.productType}</strong><small>{age(b.createdAt)}</small></span>
              </Link>)}</div>
              {!latest.length && <p className="text-muted">No bookings yet.</p>}
              <Link href="/bookings" className={styles.seeAll}>See all bookings</Link>
            </section>
          </aside>
        </div>
      </>}
    </div>
  );
}
