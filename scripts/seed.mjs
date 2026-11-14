// Prepares sample data for the presentation: accounts, 36 spots and sample bookings.
//
// Usage:  npm run seed
//         (reads BACKEND_URL from the shell, else from .env.local, else http://localhost:5050)
//
// Safe to run again: existing accounts are reused, existing spots are skipped and
// bookings that already exist are left alone.

import { existsSync, readFileSync } from "node:fs";

if (!process.env.BACKEND_URL && existsSync(".env.local")) {
  const line = readFileSync(".env.local", "utf8").split(/\r?\n/).find((l) => l.trim().startsWith("BACKEND_URL="));
  if (line) process.env.BACKEND_URL = line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
}
const BASE = (process.env.BACKEND_URL || "http://localhost:5050").replace(/\/$/, "") + "/api/v1";
console.log(`Seeding ${BASE}\n`);

const ADMIN = { name: "Kanya Srisuk", email: "admin@saengdao.market", tel: "0811111111", role: "admin", password: "admin123" };

// Members and the bookings each one makes. `in` = days from today (UTC, as the backend uses).
const MEMBERS = [
  {
    user: { name: "Somchai Prasert", email: "somchai@example.com", tel: "0812345678", role: "member", password: "member123" },
    bookings: [
      { spot: "B4", in: 7, product: "Handmade bags" },
      { spot: "C2", in: 8, product: "Thai milk tea" },
      { spot: "A2", in: 2, product: "Grilled food" },
    ],
  },
  {
    user: { name: "Nok Wattana", email: "nok@example.com", tel: "0825550199", role: "member", password: "member123" },
    bookings: [
      { spot: "A3", in: 7, product: "Pad thai" },
      { spot: "A4", in: 7, product: "Fresh juice" },
      { spot: "A9", in: 9, product: "Noodles" },
      { spot: "A3", in: 1, product: "Pad thai" },
    ],
  },
  {
    user: { name: "Ploy Sirikul", email: "ploy@example.com", tel: "0834441122", role: "member", password: "member123" },
    bookings: [
      { spot: "B7", in: 7, product: "Vintage clothing" },
      { spot: "B8", in: 10, product: "Handmade crafts" },
      { spot: "B1", in: 0, product: "Vintage clothing" },
    ],
  },
  {
    user: { name: "Arthit Chaiya", email: "arthit@example.com", tel: "0846667788", role: "member", password: "member123" },
    bookings: [
      { spot: "C5", in: 7, product: "Mango sticky rice" },
      { spot: "C11", in: 13, product: "Coconut ice cream" },
      { spot: "A5", in: 13, product: "Grilled food" },
      { spot: "C1", in: 0, product: "Coconut ice cream" },
    ],
  },
];

const ZONES = [
  {
    zone: "A · Food street",
    fee: (i) => (i % 5 === 0 ? 420 : 350),
    size: (i) => (i % 5 === 0 ? "3 x 3 m" : "2 x 3 m"),
    where: (i) => (i <= 6 ? `Stall ${i} from the main gate, left side` : `Stall ${i - 6} from the main gate, right side`),
  },
  {
    zone: "B · Clothing and crafts",
    fee: () => 280,
    size: () => "2 x 2 m",
    where: (i) => (i <= 6 ? `Centre lane, north row, stall ${i}` : `Centre lane, south row, stall ${i - 6}`),
  },
  {
    zone: "C · Drinks and desserts",
    fee: (i) => (i <= 4 ? 320 : 300),
    size: () => "2 x 3 m",
    where: (i) => (i <= 4 ? `Facing the stage, stall ${i}` : `Beside the seating area, stall ${i - 4}`),
  },
];

const day = (offset) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

async function call(path, { method = "GET", body, token } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    fail(`Can't reach ${BASE}. Is the backend running on that port?`);
  }
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    fail(
      `${BASE} answered ${res.status} with something that isn't the booking API.\n` +
        (res.status === 403
          ? "On a Mac, port 5000 is taken by AirPlay Receiver. Run the backend on another port (PORT=5050 in config/config.env)\nand set BACKEND_URL=http://localhost:5050 in .env.local."
          : "Check BACKEND_URL in .env.local."),
    );
  }
  return { ok: res.ok && json.success, status: res.status, json };
}

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

async function account(user) {
  const login = await call("/auth/login", { method: "POST", body: { email: user.email, password: user.password } });
  if (login.ok) return login.json.data.token;
  const reg = await call("/auth/register", { method: "POST", body: user });
  if (!reg.ok) fail(`Could not create ${user.email}: ${reg.json.error ?? reg.status}`);
  return reg.json.data.token;
}

// 1. Accounts and spots
const adminToken = await account(ADMIN);
const existing = (await call("/spots")).json.data ?? [];
const has = new Set(existing.map((s) => `${s.zone}|${s.spotNumber}`));
let createdSpots = 0;
for (const z of ZONES) {
  for (let i = 1; i <= 12; i++) {
    const spotNumber = `${z.zone[0]}${i}`;
    if (has.has(`${z.zone}|${spotNumber}`)) continue;
    const r = await call("/spots", {
      method: "POST",
      token: adminToken,
      body: { spotNumber, zone: z.zone, spotSize: z.size(i), locationDescription: z.where(i), rentalFee: z.fee(i) },
    });
    if (!r.ok) fail(`Could not create spot ${spotNumber}: ${r.json.error ?? r.status}`);
    createdSpots++;
  }
}
const spots = (await call("/spots")).json.data;
const spotId = (number) => spots.find((s) => s.spotNumber === number && ZONES.some((z) => z.zone === s.zone))?._id;
console.log(`Spots:    ${createdSpots} created, ${spots.length - createdSpots} already there`);

// 2. Members and their bookings
let createdBookings = 0;
let skipped = 0;
for (const m of MEMBERS) {
  const token = await account(m.user);
  for (const b of m.bookings) {
    const r = await call("/bookings", {
      method: "POST",
      token,
      body: { spot: spotId(b.spot), bookingDate: day(b.in), productType: b.product },
    });
    if (r.ok) createdBookings++;
    else if (r.status === 409) skipped++;
    else console.warn(`  ${m.user.name} ${b.spot} on ${day(b.in)}: ${r.json.error}`);
  }
}
console.log(`Bookings: ${createdBookings} created, ${skipped} already there or taken`);
console.log(`\nBusiest night for the demo: ${day(7)} (most vendors booked)\n`);
console.log("Accounts (all members use password member123):");
console.log(`  admin   ${ADMIN.email} / ${ADMIN.password}`);
for (const m of MEMBERS) console.log(`  member  ${m.user.email}`);
