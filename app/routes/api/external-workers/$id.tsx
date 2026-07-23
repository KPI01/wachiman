import { validateUserRole } from "~/lib/auth.server";
import { getExternalWorkerById } from "~/lib/services/external-worker.server";

export async function loader({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  await validateUserRole(request, ["ADMIN", "SECURITY_MANAGER", "ACCESS_APPROVER"]);
  const worker = await getExternalWorkerById(params.id);

  if (!worker) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(worker);
}
