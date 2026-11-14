export type Role = "admin" | "member";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Spot = {
  _id: string;
  spotNumber: string;
  zone: string;
  spotSize: string;
  locationDescription: string;
  rentalFee: number;
  isActive?: boolean;
};

export type BookingUser = {
  _id: string;
  name: string;
  email: string;
  tel: string;
  role: Role;
};

export type Booking = {
  _id: string;
  spot: Spot | null;
  user: BookingUser | null;
  bookingDate: string;
  productType: string;
  createdAt: string;
};

export type SpotInput = Omit<Spot, "_id" | "isActive">;
