"use client";

// TODO(team) Task 1: Calendar view with drag-and-drop rescheduling. Spec: TEAM_TASKS.md
// BookingsView already renders <Calendar /> when the "Calendar" tab is selected and
// passes these props. Call onMove(booking, "YYYY-MM-DD") when a booking is dropped on
// another day; it sends the PUT request and shows the success or error message.

import type { Booking } from "@/lib/types";
import ComingSoon from "../ComingSoon";

type Props = {
  bookings: Booking[];
  showVendor: boolean;
  onMove: (booking: Booking, toDate: string) => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Calendar({ bookings, showVendor, onMove }: Props) {
  return <ComingSoon title="Calendar view with drag and drop" task="Task 1" />;
}
