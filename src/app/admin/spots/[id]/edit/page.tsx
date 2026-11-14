import SpotForm from "@/components/admin/SpotForm";

export default async function EditSpotPage({ params }: PageProps<"/admin/spots/[id]/edit">) {
  const { id } = await params;
  return <SpotForm id={id} />;
}
