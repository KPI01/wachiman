import { getExternalWorkerById } from "~/lib/services/external-worker.server";

export async function loader({
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  const worker = await getExternalWorkerById(params.id);

  if (!worker) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(worker);
}
