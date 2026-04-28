import { redirect } from "react-router";
import { getSessionUser } from "./session.server";
import type { UserRole } from "../../prisma/generated/prisma/enums";

export async function isAuthenticated(request: Request) {
  const user = await getSessionUser(request);

  if (!user) {
    throw redirect("/login");
  }

  return user;
}

export async function validateUserRole(
  request: Request,
  role: UserRole | UserRole[],
) {
  const user = await isAuthenticated(request);
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!user.role || !allowedRoles.includes(user.role)) {
    throw redirect("/unauthorized");
  }

  return user;
}
