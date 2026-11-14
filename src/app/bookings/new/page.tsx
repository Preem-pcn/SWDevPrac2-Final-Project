import NewBooking from "@/components/bookings/NewBooking";

export default async function NewBookingPage({ searchParams }: PageProps<"/bookings/new">) {
  const { spot, date } = await searchParams;
  return <NewBooking initialSpot={typeof spot === "string" ? spot : undefined} initialDate={typeof date === "string" ? date : undefined} />;
}
