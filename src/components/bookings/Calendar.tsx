"use client";

import Link from "next/link";
import { useState } from "react";
import { DndContext, DragOverlay, pointerWithin, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { addDays, dayKey, formatDay, keyToDate, todayKey } from "@/lib/date";
import type { Booking } from "@/lib/types";
import { checkRules } from "./rules";
import { useBookingClock } from "@/lib/hooks";
import { bookingIsLocked, bookingDayHasPassed, bookingLockMessage } from "@/lib/booking-policy";
import { Modal } from "../ui";
import styles from "../extras-styles";

type Props = { bookings: Booking[]; knownBookings?: Booking[]; showVendor: boolean; onMove: (booking: Booking, toDate: string) => Promise<void> };
export default function Calendar({ bookings, knownBookings = bookings, showVendor, onMove }: Props) {
  const now = useBookingClock();
  const [openedDay, setOpenedDay] = useState<string | null>(null);
  const sortSpots = (list: Booking[]) => [...list].sort((a, b) => (a.spot?.spotNumber ?? "~").localeCompare(b.spot?.spotNumber ?? "~", "en", { numeric: true, sensitivity: "base" }) || a._id.localeCompare(b._id));
  const onDay = (date: string) => { const list = bookings.filter((b) => dayKey(b.bookingDate) === date); return showVendor ? sortSpots(list) : list; };
  const [month, setMonth] = useState(() => todayKey().slice(0, 7) + "-01");
  const [active, setActive] = useState<Booking | null>(null);
  const [overDate, setOverDate] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] } }));
  const offset = (keyToDate(month).getUTCDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => addDays(month, i - offset));
  const rulesFor = (b: Booking, date: string) => checkRules({ date, spotId: b.spot?._id, ownerId: b.user?._id, known: knownBookings, excludeId: b._id, canSeeOthers: showVendor });
  const changeMonth = (n: number) => { const d = keyToDate(month); d.setUTCMonth(d.getUTCMonth() + n); setMonth(d.toISOString().slice(0, 10)); };
  const clearDrag = () => { setActive(null); setOverDate(null); };
  const end = async ({ over }: DragEndEvent) => {
    const b = active;
    clearDrag();
    if (!b || !over || over.id === dayKey(b.bookingDate)) return;
    if (!showVendor && bookingIsLocked(b.bookingDate)) { setMessage(bookingLockMessage(b.bookingDate)); return; }
    const date = String(over.id);
    if (rulesFor(b, date).blocked) {
      setMessage(`${b.spot?.spotNumber ?? "Booking"} stayed on ${formatDay(dayKey(b.bookingDate))}. That date is in the past, already booked, or exceeds the vendor’s 3-spot limit.`);
      return;
    }
    setMessage(""); setPending(true);
    try { await onMove(b, date); } finally { setPending(false); }
  };
  const destinationRules = active && overDate ? rulesFor(active, overDate) : null;

  return (
    <div className={styles.calendarLayout}>
      <section className={styles.calendarPanel}>
        <div className={styles.calendarHeader}>
          <h2 className="display">{formatDay(month, "month")}</h2>
          <div className={styles.monthButtons}><button aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button><button aria-label="Next month" onClick={() => changeMonth(1)}>›</button></div>
        </div>
        <p role="status" className={pending || message ? "text-sky mb-3" : "sr-only"}>{pending ? "Saving new market night…" : message}</p>
        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={(args) => args.pointerCoordinates ? pointerWithin(args) : closestCenter(args)} onDragStart={({ active: a }) => { setMessage(""); setActive(bookings.find((b) => b._id === a.id) ?? null); }} onDragOver={({ over }) => setOverDate(over ? String(over.id) : null)} onDragCancel={clearDrag} onDragEnd={end}>
            <div className={styles.calendarGrid}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <p key={d} className={styles.weekday}>{d}</p>)}
              {days.map((date) => <Day key={date} date={date} onOpen={showVendor ? () => setOpenedDay(date) : undefined} active={active} invalid={!!active && rulesFor(active, date).blocked}>
                {(showVendor ? onDay(date).slice(0, 3) : onDay(date)).map((b) => <Chip key={b._id} booking={b} showVendor={showVendor} disabled={pending || (!showVendor && (now === null || bookingIsLocked(b.bookingDate, now))) || date < todayKey() || !b.spot || b.spot.isActive === false} />)}
                {showVendor && onDay(date).length > 3 && <button type="button" className="extras-dayMore" onClick={() => setOpenedDay(date)}>+{onDay(date).length - 3} more · View all</button>}
              </Day>)}
            </div>
            <DragOverlay>{active && <span className={styles.dragChip}>{active.spot?.spotNumber}</span>}</DragOverlay>
          </DndContext>
        </div>
      </section>
      <aside className={styles.calendarAside}>
        <section className={styles.moving} aria-live="polite">
          <h2 className="display">{active ? `Moving ${active.spot?.spotNumber ?? "booking"}` : "Move a booking"}</h2>
          {active && overDate ? <p>{destinationRules?.blocked ? "This night is not allowed. Your booking will stay on its original date." : <>Drop on {formatDay(overDate, "short")} to move it there.<br />{showVendor ? "This vendor will have" : "You will have"} {(destinationRules?.ownCount ?? 0) + 1} of 3 spots that night.</>}</p> : <p>Drag a booking to another night to move it.</p>}
          <small>{active ? "Release to move · press Esc to cancel" : "Tap a booking to open its pass"}</small>
        </section>
        <section className={styles.legend}>
          <h2 className="display">How dragging works</h2>
          {!showVendor && now !== null && bookings.some((b) => bookingIsLocked(b.bookingDate, now) && !bookingDayHasPassed(b.bookingDate, now)) && <p className="text-sm text-muted">After 17:00 Bangkok time on the booking date, contact an admin to change or cancel your booking.</p>}
          {(showVendor ? [["bg-sky", "Booking", "Tap a spot to open its pass"], ["bg-lantern", "Being moved", "Follows your pointer or finger"], ["bg-brand", "Allowed night", "Today or later, under 3 spots for this vendor"], ["bg-danger", "Not allowed", "Past night, occupied spot or vendor limit reached; the booking snaps back"]] : [["bg-sky", "Your booking", "Tap it to open its pass"], ["bg-lantern", "Being moved", "Follows your pointer or finger"], ["bg-brand", "Allowed night", "Today or later, under 3 spots"], ["bg-danger", "Not allowed", "Past night or 3 spots already booked; the booking snaps back"]]).map(([color, title, description]) => <div key={title} className={`${styles.legendItem} ${showVendor && (title === "Allowed night" || title === "Not allowed") ? "extras-dayLegend" : ""}`}><span className={color} /><p>{title}<small>{description}</small></p></div>)}
        </section>
      </aside>
      {showVendor && <Modal open={openedDay !== null} onClose={() => setOpenedDay(null)} width="max-w-[760px]">
        {openedDay && <div className="flex flex-col gap-5"><div className="flex items-start justify-between gap-4"><div><h2 className="display text-3xl">Bookings on {formatDay(openedDay)}</h2><p className="text-muted mt-2">{onDay(openedDay).length} spots · sorted by spot number</p></div><button className="btn btn-sm bg-field" onClick={() => setOpenedDay(null)}>Close</button></div>
          <div className="max-h-[55vh] overflow-auto flex flex-col gap-3">{onDay(openedDay).map((b) => <Link key={b._id} href={`/bookings/${b._id}/pass`} className="flex items-start gap-4 rounded-2xl bg-night p-4"><strong className="rounded-xl bg-sky text-onlight px-3 py-2">{b.spot?.spotNumber ?? "Removed"}</strong><span><strong>{b.user?.name ?? "Deleted user"}</strong><span className="block text-muted">Zone {b.spot?.zone ?? "—"} · {b.productType}</span>{!bookingDayHasPassed(b.bookingDate, now ?? Number.POSITIVE_INFINITY) && (!b.spot || b.spot.isActive === false) && <span className="text-danger">Removed spot</span>}</span><span className="ml-auto text-sky">Pass →</span></Link>)}{!onDay(openedDay).length && <p className="text-muted">No bookings on this night.</p>}</div>
        </div>}
      </Modal>}
    </div>
  );
}

function Day({ date, active, invalid, children, onOpen }: { onOpen?: () => void; date: string; active: Booking | null; invalid: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  const today = date === todayKey();
  return <div ref={setNodeRef} onClick={(e) => { if (e.target === e.currentTarget) onOpen?.(); }} data-date={date} className={`${styles.calendarDay} ${date >= todayKey() ? styles.futureDay : styles.pastDay} ${today ? styles.today : ""} ${isOver && active ? invalid ? styles.dropInvalid : styles.dropAllowed : ""}`}>
    <p className={styles.dayNumber}><span>{onOpen ? <button type="button" className="extras-dayOpen" aria-label={`View all bookings on ${formatDay(date)}`} onClick={onOpen}>{formatDay(date, "day")}</button> : formatDay(date, "day")}</span>{today && <small>Today</small>}</p><div className={styles.dayChips}>{children}</div>
  </div>;
}

function Chip({ booking: b, showVendor, disabled }: { booking: Booking; showVendor: boolean; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: b._id, disabled });
  return <Link ref={setNodeRef} {...attributes} {...listeners} role="link" draggable={false} href={`/bookings/${b._id}/pass`} title={`${b.spot?.spotNumber ?? "Removed spot"} · ${b.productType}${showVendor ? ` · ${b.user?.name ?? "Deleted user"}` : ""}`} aria-label={`Pass for ${b.spot?.spotNumber ?? "removed spot"} on ${formatDay(dayKey(b.bookingDate))}`} className={`${styles.chip} ${isDragging ? styles.ghost : ""} ${disabled ? styles.disabledChip : ""}`}>{b.spot?.spotNumber ?? "Removed"}</Link>;
}
