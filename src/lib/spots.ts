import type { Spot } from "./types";

export const byNumber = (a: Spot, b: Spot) => a.spotNumber.localeCompare(b.spotNumber, "en", { numeric: true });

export function groupByZone(spots: Spot[]) {
  const map = new Map<string, Spot[]>();
  for (const s of spots) map.set(s.zone, [...(map.get(s.zone) ?? []), s]);
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([zone, list]) => [zone, list.sort(byNumber)] as const);
}

// "A · Food street" -> "A"; anything else -> first letter.
export const zoneLetter = (zone: string) => (zone.match(/^\s*([A-Za-z0-9]+)\s*[·\-:]/)?.[1] ?? zone.trim()[0] ?? "?").toUpperCase();
export const zoneName = (zone: string) => zone.replace(/^\s*[A-Za-z0-9]+\s*[·\-:]\s*/, "") || zone;
