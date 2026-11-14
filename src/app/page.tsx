import Link from "next/link";
import Lanterns from "@/components/Lanterns";
import { groupByZone, zoneLetter, zoneName } from "@/lib/spots";
import { backend } from "@/lib/backend";
import { baht } from "@/lib/date";
import type { Spot } from "@/lib/types";

const archColors = [
  ["bg-lantern text-onlight", "bg-white/55"],
  ["bg-sky text-onlight", "bg-white/55"],
  ["bg-brand text-ink", "bg-night/40"],
];

const steps = [
  {
    title: "Find a free spot",
    body: "Every stall is on the map, grouped by zone. Tap one to see its size, location and nightly fee.",
    icon: <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />,
  },
  {
    title: "Pick the night",
    body: "Choose any date from today and tell us what you sell. You can hold up to 3 spots a night.",
    icon: <path d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z M3 10h18 M8 3v4 M16 3v4" />,
  },
  {
    title: "Show your pass",
    body: "Each booking gets a vendor pass with a QR code. Change the night, or release a spot, from My bookings.",
    icon: <path d="M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h2v2h-2z M18 18h2v2h-2z M14 18h2v2" />,
  },
];

export default async function Home() {
  const { json } = await backend("/spots");
  const spots: Spot[] = json.success ? json.data : [];
  const zones = groupByZone(spots);
  const fees = spots.map((s) => s.rentalFee);
  const minFee = fees.length ? Math.min(...fees) : null;

  return (
    <>
      {/* Hero */}
      <section className="grid gap-6 px-5 pb-6 md:px-6 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[1fr_minmax(0,46%)]">
        <div className="flex flex-col justify-center gap-9 py-10 md:px-4">
          <h1 className="display rise max-w-[11ch] text-6xl md:text-8xl lg:text-[104px]">Book your stall for tonight.</h1>
          <p className="rise max-w-[52ch] text-lg text-muted md:text-xl" style={{ animationDelay: "80ms" }}>
            Saengdao Night Market opens every evening from 17:00. Pick a spot on the map, choose your night and set up shop.
          </p>
          <div className="rise flex flex-wrap gap-4" style={{ animationDelay: "160ms" }}>
            <Link href="/spots" className="btn bg-lantern text-onlight hover:bg-glow">
              See available spots
            </Link>
            <Link href="/register" className="btn bg-field text-ink hover:bg-brand">
              Create vendor account
            </Link>
          </div>
          <dl className="rise flex flex-wrap gap-x-14 gap-y-6" style={{ animationDelay: "240ms" }}>
            {[
              [String(spots.length), "spots on the map"],
              [String(zones.length), zones.length === 1 ? "zone" : "zones"],
              [minFee === null ? "—" : baht(minFee), "lowest nightly fee"],
            ].map(([a, b]) => (
              <div key={b}>
                <dt className="display text-5xl text-lantern md:text-6xl">{a}</dt>
                <dd className="text-muted">{b}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[48px] bg-brand px-6 pb-10 pt-36">
          <Lanterns className="absolute inset-x-6 top-4 h-auto w-[calc(100%-3rem)]" />
          {spots.length ? (
            <div className="flex max-w-[480px] flex-wrap justify-center gap-2.5">
              {zones.flatMap(([, list]) => list).slice(0, 36).map((s) => (
                <Link
                  key={s._id}
                  href={`/spots?spot=${s._id}`}
                  className="grid size-14 place-items-center rounded-xl bg-lantern text-sm font-semibold text-onlight transition-transform hover:-translate-y-1 md:size-16"
                >
                  {s.spotNumber}
                </Link>
              ))}
            </div>
          ) : (
            <p className="max-w-sm text-center text-lg">
              {json.success ? "No spots yet. An admin can add them from Manage spots." : "The booking server is offline right now."}
            </p>
          )}
          <p className="mt-7 flex items-center gap-3 text-xl font-semibold">
            <span className="size-3.5 rounded-full bg-lantern" />
            {spots.length} spots across {zones.length} {zones.length === 1 ? "zone" : "zones"}
          </p>
        </div>
      </section>

      {/* Zones */}
      {zones.length > 0 && (
        <section className="flex flex-col gap-12 px-5 pt-24 md:px-10 md:pt-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="display text-5xl md:text-7xl">
              {zones.length === 1 ? "One zone" : `${zones.length} zones`}, one market
            </h2>
            <p className="max-w-[42ch] text-lg text-muted">
              Every spot belongs to a zone. Each zone has its own lane, its own crowd and its own nightly fee.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {zones.map(([zone, list], i) => {
              const f = list.map((s) => s.rentalFee);
              const lo = Math.min(...f);
              const hi = Math.max(...f);
              return (
                <Link
                  key={zone}
                  href="/spots"
                  className={`group flex min-h-[520px] flex-col items-center gap-3 rounded-b-[32px] rounded-t-[999px] px-8 pb-10 pt-24 text-center transition-transform hover:-translate-y-1 ${archColors[i % 3][0]}`}
                >
                  <span className="display text-[160px]">{zoneLetter(zone)}</span>
                  <span className="display text-4xl">{zoneName(zone)}</span>
                  <span className="mt-auto flex flex-wrap justify-center gap-2">
                    <span className={`rounded-full px-4 py-2.5 font-semibold ${archColors[i % 3][1]}`}>
                      {lo === hi ? baht(lo) : `${baht(lo)}–${baht(hi)}`} a night
                    </span>
                    <span className={`rounded-full px-4 py-2.5 font-semibold ${archColors[i % 3][1]}`}>
                      {list.length} spots
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="flex flex-col gap-12 px-5 pt-24 md:px-10 md:pt-32">
        <h2 className="display text-5xl md:text-7xl">From map to stall in a minute</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="flex flex-col gap-5 rounded-[32px] bg-surface p-10">
              <span className="grid size-[72px] place-items-center rounded-full bg-brand">
                <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="#F3F9FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {s.icon}
                </svg>
              </span>
              <h3 className="display text-3xl">{s.title}</h3>
              <p className="text-lg text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rules */}
      <section className="px-3 pt-24 md:px-6 md:pt-32">
        <div className="flex flex-col justify-between gap-6 rounded-[40px] bg-lantern px-8 py-11 text-onlight md:flex-row md:items-center md:px-12">
          {["Book any night from today", "One vendor per spot each night", "Up to 3 spots a night"].map((r) => (
            <p key={r} className="display text-3xl">
              {r}
            </p>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-5 px-5 pb-12 pt-24 md:px-10">
        <p className="display text-[clamp(5rem,16vw,15rem)] text-lantern">Saengdao</p>
        <div className="flex flex-wrap justify-between gap-4 text-muted">
          <p>Night market vendor booking · Open nightly 17:00–23:00</p>
          <p>SW Dev Prac 2 · Project 5</p>
        </div>
      </footer>
    </>
  );
}
