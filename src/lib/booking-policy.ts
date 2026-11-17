import { dayKey, marketOpensAt } from "./date";

export const BOOKING_CUTOFF_MESSAGE = "This booking can no longer be edited or cancelled after 17:00 (Bangkok time) on the booking date. Please contact an admin to change or cancel it.";

// Always use the original booking date, not a proposed replacement date.
export const bookingIsLocked = (bookingDate: string, now: number = Date.now()) =>
  now >= marketOpensAt(dayKey(bookingDate)).getTime();

// The booking day ends at midnight Bangkok time (seven hours after opening).
export const bookingDayHasPassed = (bookingDate: string, now: number = Date.now()) =>
  now >= marketOpensAt(dayKey(bookingDate)).getTime() + 7 * 60 * 60 * 1000;

export const bookingLockMessage = (bookingDate: string) => bookingDayHasPassed(bookingDate)
  ? "This booking is completed and can no longer be changed."
  : BOOKING_CUTOFF_MESSAGE;
