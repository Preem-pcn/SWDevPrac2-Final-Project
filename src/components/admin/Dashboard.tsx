"use client";

// TODO(team) Task 3: Admin dashboard (stats, next 7 nights chart, zones, latest bookings).
// Spec: TEAM_TASKS.md. The route /admin already renders this component, the admin nav
// links here, and admins land here after logging in.

import Link from "next/link";
import ComingSoon from "../ComingSoon";

export default function Dashboard() {
  return (
    <div className="px-5 pt-6 md:px-10">
      <ComingSoon title="Admin dashboard" task="Task 3">
        <div className="flex gap-3">
          <Link href="/bookings" className="btn bg-lantern text-onlight hover:bg-glow">All bookings</Link>
          <Link href="/admin/spots" className="btn bg-field hover:bg-brand">Manage spots</Link>
        </div>
      </ComingSoon>
    </div>
  );
}
