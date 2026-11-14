import SpotsView from "@/components/spots/SpotsView";

export default async function SpotsPage({ searchParams }: PageProps<"/spots">) {
  const { spot, date } = await searchParams;
  return <SpotsView initialSpot={typeof spot === "string" ? spot : undefined} initialDate={typeof date === "string" ? date : undefined} />;
}
