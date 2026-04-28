import { UserEntity } from "~/lib/database/user.server";
import { trashUserSchema, updateUserSchema } from "~/lib/schemas/user";
import type { Route } from "./+types/detail";
import z from "zod";
import { validateUserRole } from "~/lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  await validateUserRole(request, "ADMIN");

  if (request.method === "PATCH") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } =
      await updateUserSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    const { id, ...dataWithoutId } = data;

    await UserEntity.update(id, dataWithoutId);

    return { success: true };
  }

  if (request.method === "DELETE") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } =
      await trashUserSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    await UserEntity.trash(data.id);

    return { success: true };
  }

  return null;
}

export default function UserDetailRoute() {
  return null;
}
