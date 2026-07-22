import { validateUserRole } from "~/lib/auth.server";
import { CompanyEntity } from "~/lib/database/company.server";

export async function loader({ request }: { request: Request }) {
  await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_OPERATOR",
    "ACCESS_REQUESTER",
    "ACCESS_APPROVER",
  ]);

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return Response.json([]);
  }

  return Response.json(await CompanyEntity.searchByName(query));
}
