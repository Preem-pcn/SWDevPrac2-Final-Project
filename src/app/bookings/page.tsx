import BookingsView from "@/components/bookings/BookingsView";

export default async function BookingsPage({ searchParams }: PageProps<"/bookings">) {
  const { view, created } = await searchParams;
  return <BookingsView view={view === "calendar" ? "calendar" : "list"} created={typeof created === "string" ? created : undefined} />;
}
