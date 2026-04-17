import { createUser, getUsers } from "~/lib/database/user";
import type { Route } from "./+types";
import DataTable from "~/components/ui/data-table";
import { userColumns } from "~/lib/columns/user";
import CreateUser from "./create";
import z from "zod";
import { createUserSchema } from "~/lib/schemas/user";
import { redirect } from "react-router";

export async function loader() {
  const users = await getUsers();

  return { users };
}

export async function action({ request }: Route.ActionArgs) {
  const start = performance.now();

  try {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { error, data, success } =
      await createUserSchema.safeParseAsync(jsonData);

    if (error) {
      return { errors: z.treeifyError(error) };
    }

    await createUser(data);

    return { success };
  } finally {
    console.log(`[/admin/users] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export default function IndexUsers({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Usuarios</h2>

        <CreateUser />
      </div>
      <DataTable columns={userColumns} data={loaderData.users ?? []} />
    </div>
  );
}
