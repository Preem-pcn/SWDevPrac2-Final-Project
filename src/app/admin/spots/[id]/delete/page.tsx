import DeleteSpot from "@/components/admin/DeleteSpot";

export default async function DeleteSpotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeleteSpot id={id} />;
}
