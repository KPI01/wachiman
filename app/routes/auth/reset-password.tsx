import type { Route } from "./+types/reset-password";
import { validateUserRole } from "~/lib/auth.server";
import { resetUserPassword } from "~/lib/services/users.server";

export async function action({ request, params }: Route.ActionArgs) {
  await validateUserRole(request, "ADMIN");
  const rawFormData = await request.formData();
  const jsonData = Object.fromEntries(rawFormData);

  return resetUserPassword(params.userId, jsonData);
}
