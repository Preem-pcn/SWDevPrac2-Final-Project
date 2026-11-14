// The backend stores booking dates as UTC midnight and compares against the UTC day,
// so every date in the UI is a "YYYY-MM-DD" key interpreted in UTC.

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const dayKey = (iso: string) => iso.slice(0, 10);

export const keyToDate = (key: string) => new Date(`${key}T00:00:00.000Z`);

export const addDays = (key: string, days: number) => {
  const d = keyToDate(key);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const formatDay = (key: string, style: "long" | "short" | "weekday" | "day" | "month" = "long") => {
  const d = keyToDate(key);
  const opts: Record<typeof style, Intl.DateTimeFormatOptions> = {
    long: { weekday: "short", day: "numeric", month: "short", year: "numeric" },
    short: { weekday: "short", day: "numeric", month: "short" },
    weekday: { weekday: "short" },
    day: { day: "numeric" },
    month: { month: "long", year: "numeric" },
  };
  return d.toLocaleDateString("en-GB", { ...opts[style], timeZone: "UTC" });
};

export const isPast = (key: string) => key < todayKey();

// The market opens at 17:00 Bangkok time (UTC+7), which is 10:00 UTC on the booking day.
export const marketOpensAt = (key: string) => new Date(`${key}T10:00:00.000Z`);

export const baht = (n: number) => `฿${n.toLocaleString("en-US")}`;
