"use client";

// TODO(team) Task 2: Vendor pass with a QR code, PNG/PDF download and a countdown.
// Spec: TEAM_TASKS.md. The route /bookings/[id]/pass already renders this component,
// and the "Pass" buttons in My bookings / All bookings already link here.

import Link from "next/link";
import ComingSoon from "../ComingSoon";

export default function PassView({ id }: { id: string }) {
  return (
    <div className="px-5 pt-6 md:px-10">
      <ComingSoon title="Vendor pass" task="Task 2">
        <p className="text-muted">Booking id: {id}</p>
        <Link href="/bookings" className="btn bg-field hover:bg-brand">Back to bookings</Link>
      </ComingSoon>
    </div>
  );
}
