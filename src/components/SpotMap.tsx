"use client";

import { byNumber, groupByZone } from "@/lib/spots";
import type { Spot } from "@/lib/types";

export { byNumber, groupByZone };

export type TileState = "available" | "booked" | "mine" | "selected";

const styles: Record<TileState, string> = {
  available: "bg-lantern text-onlight hover:-translate-y-0.5",
  booked: "bg-booked text-muted line-through",
  mine: "bg-sky text-onlight hover:-translate-y-0.5",
  selected: "bg-ink text-onlight ring-4 ring-lantern",
};

export function SpotTile({
  spot,
  state,
  size = 64,
  onClick,
}: {
  spot: Spot;
  state: TileState;
  size?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={state === "selected"}
      aria-label={`Spot ${spot.spotNumber}, ${state}`}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-xl text-sm font-semibold transition-transform duration-150 disabled:cursor-default ${styles[state]} ${onClick ? "cursor-pointer" : ""}`}
    >
      {spot.spotNumber}
    </button>
  );
}

export function SpotMap({
  spots,
  stateOf,
  onSelect,
  size = 64,
  showZoneTitles = true,
}: {
  spots: Spot[];
  stateOf: (s: Spot) => TileState;
  onSelect?: (s: Spot) => void;
  size?: number;
  showZoneTitles?: boolean;
}) {
  const zones = groupByZone(spots);
  return (
    <div className="flex flex-col gap-6">
      {zones.map(([zone, list]) => (
        <div key={zone} className="flex flex-col gap-3">
          {showZoneTitles && <p className="font-medium text-muted">Zone {zone}</p>}
          <div className="flex flex-wrap gap-2">
            {list.map((s) => (
              <SpotTile key={s._id} spot={s} state={stateOf(s)} size={size} onClick={onSelect ? () => onSelect(s) : undefined} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: [TileState, string][] }) {
  const sw: Record<TileState, string> = { available: "bg-lantern", booked: "bg-booked", mine: "bg-sky", selected: "bg-ink" };
  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
      {items.map(([k, label]) => (
        <span key={k} className="flex items-center gap-2.5">
          <span className={`size-5 rounded-md ${sw[k]}`} />
          {label}
        </span>
      ))}
    </div>
  );
}
