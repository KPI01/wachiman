import { UserEntity } from "~/lib/database/user.server";
import type { Route } from "./+types";
import DataTable from "~/components/ui/data-table";
import { getUserColumns } from "~/lib/columns/user";
import CreateUser from "./create";
import z from "zod";
import { createUserSchema } from "~/lib/schemas/user";
import { SiteEntity } from "~/lib/database/site.server";
import { DepartmentEntity } from "~/lib/database/department.server";
import { useMemo } from "react";
import { validateUserRole } from "~/lib/auth.server";
import { createUser, updateUser } from "~/lib/services/users.server";

const USER_GLOBAL_FILTER_COLUMNS = ["fullName", "username"];

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");

  const [users, sites, departments] = await Promise.all([
    UserEntity.getAll(),
    SiteEntity.findMany(),
    DepartmentEntity.findAll(),
  ]);

  return { users, sites, departments };
}

export async function action({ request, }: Route.ActionArgs) {
  await validateUserRole(request, "ADMIN");
  const method = request.method.toUpperCase()
  const rawFormData = await request.formData();
  const jsonData = Object.fromEntries(rawFormData);

  if (method === "POST") {
    return await createUser(jsonData)
  }

  if (method === "PUT" || method === "PATCH") {
    return await updateUser(jsonData)
  }
}

export default function IndexUsers({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const sites = loaderData.sites ?? [];
  const departments = loaderData.departments ?? [];
  const users = loaderData.users ?? [];
  const columns = useMemo(
    () => getUserColumns(sites, departments),
    [sites, departments],
  );

  return (
    <div className="grid space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Usuarios</h2>

        <CreateUser
          sites={sites}
          departments={departments}
          errors={actionData?.error}
        />
      </div>
      <DataTable
        columns={columns}
        data={users}
        globalFilterColumns={USER_GLOBAL_FILTER_COLUMNS}
      />
    </div>
  );
}
