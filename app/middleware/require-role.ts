import { redirect, type MiddlewareFunction } from "react-router";
import type { UserRole } from "../../generated/prisma/enums";
import { getSessionUser } from "~/lib/session";

export function requireRole(allowedRoles: readonly UserRole[]): MiddlewareFunction<Response> {
  return async ({ request }) => {
    const user = await getSessionUser(request);

    if (!user?.role || !allowedRoles.includes(user.role)) {
      throw redirect("/unauthorized");
    }
  };
}
