import { validateUserRole } from "~/lib/auth.server";
import { searchExternalWorkers } from "~/lib/services/external-worker.server";

export async function loader({ request }: { request: Request }) {
  await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
    "ACCESS_OPERATOR",
    "ACCESS_REQUESTER",
  ]);

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";

  if (q.length < 2) {
    return Response.json([]);
  }

  const workers = await searchExternalWorkers(q);
  return Response.json(workers);
}
