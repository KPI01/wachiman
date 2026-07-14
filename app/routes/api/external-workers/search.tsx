import { searchExternalWorkers } from "~/lib/services/external-worker.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";

  if (q.length < 2) {
    return Response.json([]);
  }

  const workers = await searchExternalWorkers(q);
  return Response.json(workers);
}
