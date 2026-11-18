// Prepares a small, predictable data set for the presentation:
//   - 1 admin and 1 member account
//   - 6 spots: 3 zones with 2 spots each
//   - 1 booking by the member on a night that has already passed (16 Nov 2026)
//
// Usage:  npm run seed
//
// Spots and accounts are created through the backend API (BACKEND_URL from the shell,
// else .env.local, else http://localhost:5050). The backend refuses bookings in the past,
// so the past booking is written straight to MongoDB with MONGO_URI (from the shell, else
// .env.local, else ../PJ05-MarketVendorBook/config/config.env).
//
// Safe to run again: nothing is created twice.

import dns from "node:dns";
import { existsSync, readFileSync } from "node:fs";
import { MongoClient, ObjectId } from "mongodb";

const readVar = (file, name) => {
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, "utf8").split(/\r?\n/).find((l) => l.trim().startsWith(`${name}=`));
  return line?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "") || undefined;
};

const BACKEND_URL = process.env.BACKEND_URL || readVar(".env.local", "BACKEND_URL") || "http://localhost:5050";
const MONGO_URI =
  process.env.MONGO_URI || readVar(".env.local", "MONGO_URI") || readVar("../PJ05-MarketVendorBook/config/config.env", "MONGO_URI");
const BASE = BACKEND_URL.replace(/\/$/, "") + "/api/v1";
const PAST_NIGHT = process.env.PAST_NIGHT || "2026-11-16";

const ADMIN = { name: "Kanya Srisuk", email: "admin@saengdao.market", tel: "0811111111", role: "admin", password: "admin123" };
const MEMBER = { name: "Somchai Prasert", email: "somchai@example.com", tel: "0812345678", role: "member", password: "member123" };

const SPOTS = [
  { spotNumber: "A1", zone: "A · Food street", spotSize: "2 x 3 m", locationDescription: "First stall from the main gate, left side", rentalFee: 350 },
  { spotNumber: "A2", zone: "A · Food street", spotSize: "3 x 3 m", locationDescription: "Corner stall facing the car park", rentalFee: 420 },
  { spotNumber: "B1", zone: "B · Clothing and crafts", spotSize: "2 x 2 m", locationDescription: "Centre lane, next to the fountain", rentalFee: 280 },
  { spotNumber: "B2", zone: "B · Clothing and crafts", spotSize: "2 x 2 m", locationDescription: "Centre lane, opposite the ATM", rentalFee: 280 },
  { spotNumber: "C1", zone: "C · Drinks and desserts", spotSize: "2 x 3 m", locationDescription: "Facing the stage", rentalFee: 320 },
  { spotNumber: "C2", zone: "C · Drinks and desserts", spotSize: "2 x 3 m", locationDescription: "Beside the seating area", rentalFee: 300 },
];

const PAST_BOOKING = { spot: "A1", night: PAST_NIGHT, productType: "Grilled food" };

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

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
  try {
    const json = JSON.parse(text);
    return { ok: res.ok && json.success, status: res.status, json };
  } catch {
    fail(
      `${BASE} answered ${res.status} with something that isn't the booking API.\n` +
        (res.status === 403 ? "On a Mac, port 5000 is taken by AirPlay Receiver. Use PORT=5050 for the backend." : "Check BACKEND_URL in .env.local."),
    );
  }
}

async function account(user) {
  const login = await call("/auth/login", { method: "POST", body: { email: user.email, password: user.password } });
  if (login.ok) return login.json.data;
  const reg = await call("/auth/register", { method: "POST", body: user });
  if (!reg.ok) fail(`Could not create ${user.email}: ${reg.json.error ?? reg.status}`);
  return reg.json.data;
}

console.log(`Backend: ${BASE}`);

// 1. Accounts
const admin = await account(ADMIN);
const member = await account(MEMBER);

// 2. Spots
const existing = (await call("/spots")).json.data ?? [];
let created = 0;
for (const s of SPOTS) {
  if (existing.some((e) => e.zone === s.zone && e.spotNumber === s.spotNumber)) continue;
  const r = await call("/spots", { method: "POST", token: admin.token, body: s });
  if (!r.ok) fail(`Could not create spot ${s.spotNumber}: ${r.json.error ?? r.status}`);
  created++;
}
const spots = (await call("/spots")).json.data;
console.log(`Spots:    ${created} created, ${SPOTS.length - created} already there`);

// 3. Past booking, written directly to MongoDB
const spot = spots.find((s) => s.spotNumber === PAST_BOOKING.spot && s.zone === SPOTS[0].zone);
if (!MONGO_URI) {
  console.log("Booking:  skipped. Set MONGO_URI (same value as the backend's config.env) to add the past booking.");
} else {
  try {
    dns.setServers(["1.1.1.1", "8.8.8.8"]); // same as the backend, for Atlas SRV lookups
  } catch {}
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const bookings = client.db().collection("bookings");
    const bookingDate = new Date(`${PAST_BOOKING.night}T00:00:00.000Z`);
    const filter = { spot: new ObjectId(spot._id), bookingDate };
    if (await bookings.findOne(filter)) {
      console.log(`Booking:  ${PAST_BOOKING.spot} on ${PAST_BOOKING.night} already there`);
    } else {
      const now = new Date();
      await bookings.insertOne({
        ...filter,
        user: new ObjectId(member.id),
        productType: PAST_BOOKING.productType,
        createdAt: now,
        updatedAt: now,
        __v: 0,
      });
      console.log(`Booking:  ${MEMBER.name} booked ${PAST_BOOKING.spot} on ${PAST_BOOKING.night} (a past night)`);
    }
    console.log(`Database: ${client.db().databaseName}`);
  } catch (e) {
    fail(`Could not write the past booking to MongoDB: ${e.message}`);
  } finally {
    await client.close();
  }
}

console.log("\nAccounts");
console.log(`  admin   ${ADMIN.email} / ${ADMIN.password}`);
console.log(`  member  ${MEMBER.email} / ${MEMBER.password}`);
