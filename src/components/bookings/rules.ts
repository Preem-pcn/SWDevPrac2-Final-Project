import { dayKey, formatDay, todayKey } from "@/lib/date";
import type { Booking } from "@/lib/types";
import type { Rule } from "../Rules";

// Mirrors the backend's booking rules so vendors see problems before they submit.
// `known` is every booking the viewer can see; members only see their own, so whether
// another vendor holds the spot is only knowable for admins (or after the server answers).
export function checkRules({
  date,
  spotId,
  spotLabel,
  ownerId,
  known,
  excludeId,
  canSeeOthers,
  serverError,
}: {
  date: string;
  spotId?: string;
  spotLabel?: string;
  ownerId?: string;
  known: Booking[];
  excludeId?: string;
  canSeeOthers: boolean;
  serverError?: string | null;
}) {
  const others = known.filter((b) => b._id !== excludeId && dayKey(b.bookingDate) === date && b.spot);
  const owners = others.filter((b) => !ownerId || b.user?._id === ownerId || !b.user);
  const ownCount = owners.length;
  const ownSame = owners.some((b) => b.spot!._id === spotId);
  const takenByOther = others.some((b) => b.spot!._id === spotId && b.user?._id !== ownerId);
  const label = spotLabel ?? "this spot";
  const dateOk = !!date && date >= todayKey();

  const freeRule: Rule = canSeeOthers
    ? takenByOther
      ? { label: "Spot is free that night", note: `Another vendor has ${label}`, state: "fail" }
      : { label: "Spot is free that night", note: `Nobody else has ${label}`, state: "pass" }
    : serverError?.includes("Another vendor")
      ? { label: "Spot is free that night", note: `Another vendor has ${label}`, state: "fail" }
      : { label: "Spot is free that night", note: "Checked with the market when you confirm", state: "pending" };

  if (!spotId) {
    freeRule.state = "pending";
    freeRule.note = "Pick a spot first";
  }

  const rules: Rule[] = [
    dateOk
      ? { label: "Night is today or later", note: date ? formatDay(date) : "Pick a night", state: "pass" }
      : { label: "Night is today or later", note: date ? `${formatDay(date)} has passed` : "Pick a night", state: "fail" },
    freeRule,
    ownCount >= 3
      ? { label: "Up to 3 spots a night", note: "3 of 3 already used that night", state: "fail" }
      : { label: "Up to 3 spots a night", note: `This will be ${ownCount + 1} of 3`, state: "pass" },
    !spotId
      ? { label: "One booking per spot a night", note: "Pick a spot first", state: "pending" }
      : ownSame
        ? { label: "One booking per spot a night", note: `Already booked ${label} that night`, state: "fail" }
        : { label: "One booking per spot a night", note: `No other ${label} booking`, state: "pass" },
  ];
  return { rules, ownCount, blocked: rules.some((r) => r.state === "fail") };
}

export const PRODUCT_SUGGESTIONS = ["Grilled food", "Noodles", "Drinks", "Desserts", "Clothing", "Handmade crafts"];
