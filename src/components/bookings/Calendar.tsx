"use client";
import Link from "next/link";
import { useState } from "react";
import { DndContext, DragOverlay, pointerWithin, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { addDays, dayKey, formatDay, keyToDate, todayKey } from "@/lib/date";
import type { Booking } from "@/lib/types";
import { checkRules } from "./rules";

type Props = { bookings: Booking[]; showVendor: boolean; onMove: (booking: Booking, toDate: string) => Promise<void> };
export default function Calendar({ bookings, showVendor, onMove }: Props) {
  const [month, setMonth] = useState(() => todayKey().slice(0, 7) + "-01");
  const [active, setActive] = useState<Booking | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] } }));
  const offset = (keyToDate(month).getUTCDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => addDays(month, i - offset));
  const blocked = (b: Booking, date: string) => checkRules({ date, spotId: b.spot?._id, ownerId: b.user?._id, known: bookings, excludeId: b._id, canSeeOthers: showVendor }).blocked;
  const changeMonth = (n: number) => { const d = keyToDate(month); d.setUTCMonth(d.getUTCMonth() + n); setMonth(d.toISOString().slice(0, 10)); };
  const end = async ({ over }: DragEndEvent) => {
    const b = active; setActive(null);
    if (!b || !over || over.id === dayKey(b.bookingDate)) return;
    const date = String(over.id);
    if (blocked(b, date)) { setMessage(`${b.spot?.spotNumber ?? "Booking"} stayed on ${formatDay(dayKey(b.bookingDate))}. That date is in the past, already booked, or exceeds the vendor’s 3-spot limit.`); return; }
    setMessage(""); setPending(true);
    try { await onMove(b, date); } finally { setPending(false); }
  };
  return <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
    <section className="min-w-0 rounded-[32px] bg-surface p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6"><h2 className="display text-3xl">{formatDay(month, "month")}</h2><div className="flex gap-2"><button aria-label="Previous month" onClick={() => changeMonth(-1)} className="btn btn-sm bg-field">←</button><button onClick={() => setMonth(todayKey().slice(0, 7) + "-01")} className="btn btn-sm bg-field">Today</button><button aria-label="Next month" onClick={() => changeMonth(1)} className="btn btn-sm bg-field">→</button></div></div>
      <p role="status" className="text-sky mb-3">{pending ? "Saving new market night…" : message}</p>
      <div className="overflow-x-auto">
        <DndContext sensors={sensors} collisionDetection={(args) => args.pointerCoordinates ? pointerWithin(args) : closestCenter(args)} onDragStart={({ active: a }) => { setMessage(""); setActive(bookings.find((b) => b._id === a.id) ?? null); }} onDragCancel={() => setActive(null)} onDragEnd={end}>
          <div className="grid grid-cols-7 min-w-[630px] gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <p key={d} className="p-2 text-sm text-muted">{d}</p>)}
            {days.map((date) => <Day key={date} date={date} outside={!date.startsWith(month.slice(0, 7))} active={active} invalid={!!active && blocked(active, date)}>
              {bookings.filter((b) => dayKey(b.bookingDate) === date).map((b) => <Chip key={b._id} booking={b} showVendor={showVendor} disabled={pending || date < todayKey() || !b.spot || b.spot.isActive === false} />)}
            </Day>)}
          </div>
          <DragOverlay>{active && <div className="rounded-xl bg-lantern text-onlight px-4 py-3 font-bold shadow-2xl rotate-3">{active.spot?.spotNumber} · {active.productType}</div>}</DragOverlay>
        </DndContext>
      </div>
    </section>
    <aside className="rounded-[32px] bg-surface p-6 flex flex-col gap-5"><h2 className="display text-2xl">Move your market night</h2><p className="text-muted">Drag a spot to another day. Click a spot to open its pass. Press Escape to cancel a drag.</p>{[["bg-lantern", "Yellow · your booking"], ["bg-sky", "Blue outline · drop destination"], ["bg-danger", "Red · date not allowed"], ["bg-field", "Dashed outline · original position"]].map(([color, text]) => <p key={text} className="flex items-center gap-3 text-sm"><span className={`size-3 shrink-0 rounded-full ${color}`} />{text}</p>)}<p className="text-muted">Past bookings cannot be moved. Each vendor can hold up to 3 spots per night, with no duplicate spot.</p><p className="rounded-2xl bg-field p-4">If the new date breaks a rule or another vendor holds the spot, the booking snaps back to its original day.</p></aside>
  </div>;
}
function Day({ date, outside, active, invalid, children }: { date: string; outside: boolean; active: Booking | null; invalid: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  return <div ref={setNodeRef} className={`min-h-28 rounded-xl border-2 p-2 ${isOver && active ? invalid ? "border-danger bg-danger-surface" : "border-sky bg-brand" : "border-transparent bg-night/50"} ${outside ? "opacity-45" : ""}`}><p className={`mb-2 text-sm ${date === todayKey() ? "bg-lantern text-onlight rounded-full size-7 flex items-center justify-center font-bold" : "text-muted"}`}>{formatDay(date, "day")}</p><div className="flex flex-col gap-1">{children}</div></div>;
}
function Chip({ booking: b, showVendor, disabled }: { booking: Booking; showVendor: boolean; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: b._id, disabled });
  return <Link ref={setNodeRef} {...attributes} {...listeners} role="link" draggable={false} href={`/bookings/${b._id}/pass`} title={`${b.spot?.spotNumber ?? "Removed spot"} · ${b.productType}${showVendor ? ` · ${b.user?.name ?? "Deleted user"}` : ""}`} aria-label={`Pass for ${b.spot?.spotNumber ?? "removed spot"} on ${formatDay(dayKey(b.bookingDate))}`} className={`touch-none rounded-lg border px-2 py-1 text-sm font-semibold ${isDragging ? "border-dashed border-muted text-transparent" : disabled ? "border-transparent bg-field text-muted" : "border-transparent bg-lantern text-onlight cursor-grab"}`}>{b.spot?.spotNumber ?? "Removed"}</Link>;
}
