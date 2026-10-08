import { validateUserRole } from "~/lib/auth.server";
import { searchAllowedAreas } from "~/lib/services/allowed-area.server";
import { getSessionSite } from "~/lib/session.server";

export async function loader({ request }: { request: Request }) {
  const user = await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_OPERATOR",
    "ACCESS_APPROVER",
  ]);

  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  const site = await getSessionSite(request);
  const siteId = ["ACCESS_OPERATOR", "ACCESS_APPROVER"].includes(user.role ?? "")
    ? site?.id : params.get("siteId") ?? site?.id;

  if (query.length < 2 || !siteId) {
    return Response.json([]);
  }

  return Response.json(await searchAllowedAreas(query, siteId));
}
