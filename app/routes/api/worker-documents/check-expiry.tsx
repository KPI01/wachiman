import { validateUserRole } from "~/lib/auth.server";
import { checkExpiredDocuments } from "~/lib/services/worker-document.server";

export async function loader({ request }: { request: Request }) {
  await validateUserRole(request, ["ADMIN"]);
  const result = await checkExpiredDocuments();
  return Response.json(result);
}
