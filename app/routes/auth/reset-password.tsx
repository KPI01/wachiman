import { redirect } from "react-router";
import { UserEntity } from "~/lib/database/user.server";
import type { Route } from "./+types/reset-password";
import { updatePasswordSchema } from "~/lib/schemas/auth";
import z from "zod";
import { validateUserRole } from "~/lib/auth.server";

export async function action({ request, params }: Route.ActionArgs) {
  await validateUserRole(request, "ADMIN");
  const rawFormData = await request.formData();
  const jsonData = Object.fromEntries(rawFormData);

  const { data, error } = await updatePasswordSchema.safeParseAsync(jsonData);

  if (error) {
    return { errors: z.treeifyError(error) };
  }

  await UserEntity.updatePassword(params.userId, data);

  return redirect("/admin/users");
}
