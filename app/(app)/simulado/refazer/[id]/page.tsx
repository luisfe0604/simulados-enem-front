import SimuladoRunner from "@/components/SimuladoRunner";

export default async function RefazerSimuladoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SimuladoRunner retryId={id} />;
}
