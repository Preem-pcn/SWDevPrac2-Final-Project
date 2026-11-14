import PassView from "@/components/bookings/PassView";

export default async function PassPage({ params }: PageProps<"/bookings/[id]/pass">) {
  const { id } = await params;
  return <PassView id={id} />;
}
