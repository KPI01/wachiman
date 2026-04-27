import { getSessionUser } from "~/lib/session.server";
import { redirect } from "react-router";
import { UserEntity } from "~/lib/database/user.server";
import type { Route } from "./+types/reset-password";
import { updatePasswordSchema } from "~/lib/schemas/auth";
import z from "zod";

export async function action({ request, params }: Route.ActionArgs) {
  const start = performance.now();

  try {
    const sessionUser = await getSessionUser(request);
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);

    if (!sessionUser || sessionUser.role !== "ADMIN") {
      throw redirect("/unauthorized");
    }

    const { data, error } = await updatePasswordSchema.safeParseAsync(jsonData);

    if (error) {
      return { errors: z.treeifyError(error) };
    }

    await UserEntity.updatePassword(params.userId, data);

    return redirect("/admin/users");
  } finally {
    console.log(
      `[/auth/reset-password] ${(performance.now() - start).toFixed(2)}ms`,
    );
  }
}
