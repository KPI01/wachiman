import DataTable from "~/components/ui/data-table";
import { getUserColumns } from "~/lib/columns/user";
import { useMemo, useState } from "react";
import { validateUserRole } from "~/lib/auth.server";
import {
  createUser,
  getManyUsers,
  trashUser,
  updateUser,
} from "~/lib/services/users.server";
import type { Route } from "./+types/users";
import CreateUserForm from "~/components/models/user/create-user-form";
import { getManySites } from "~/lib/services/sites.server";
import { getManyDepartments } from "~/lib/services/departments.server";
import { Separator } from "~/components/ui/separator";
import { USER_QUICK_FILTERS } from "~/components/ui/table-filter-presets";
import type { UserRole } from "../../../db/enums";
import { isTableOnlyDataRequest } from "~/lib/table-query.server";
import UserDetails from "~/components/models/user/user-details-form";

const USER_GLOBAL_FILTER_COLUMNS = ["fullName", "username"];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await validateUserRole(request, "ADMIN");
  const url = new URL(request.url);
  const activeParam = url.searchParams.get("active");
  const isActive = activeParam === "all" ? null : activeParam === "inactive" ? false : true;
  const roleValue = url.searchParams.get("role");
  const validRoles: UserRole[] = ["ADMIN", "SECURITY_MANAGER", "ACCESS_OPERATOR", "ACCESS_MONITOR", "ACCESS_REQUESTER", "ACCESS_APPROVER"];

  const userFilters = {
      isActive,
      query: url.searchParams.get("q")?.trim() || undefined,
      siteId: url.searchParams.get("siteId") || undefined,
      departmentId: url.searchParams.get("departmentId") || undefined,
      role: validRoles.includes(roleValue as UserRole) ? roleValue as UserRole : undefined,
      exclude: {
        id: user.id,
      },
    };

  if (isTableOnlyDataRequest(request)) {
    return { users: getManyUsers(userFilters), sites: [], departments: [] };
  }

  const [sites, departments] = await Promise.all([
    getManySites(),
    getManyDepartments(),
  ]);
  const users = getManyUsers(userFilters);

  return { users, sites, departments };
}

export async function action({ request }: Route.ActionArgs) {
  await validateUserRole(request, "ADMIN");
  const method = request.method.toUpperCase();
  const rawFormData = await request.formData();
  const jsonData = Object.fromEntries(rawFormData);

  if (method === "POST") {
    return await createUser(jsonData);
  }

  if (method === "PUT" || method === "PATCH") {
    return await updateUser(jsonData);
  }

  if (method === "DELETE") {
    return await trashUser(jsonData);
  }
}

export default function IndexUsers({
  loaderData,
}: Route.ComponentProps) {
  const sites = loaderData.sites ?? [];
  const departments = loaderData.departments ?? [];
  const users = loaderData.users;
  type UserRow = Awaited<typeof users>[number];
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const columns = useMemo(
    () => getUserColumns(),
    [],
  );

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex">
        <h2 className="text-3xl font-bold">Usuarios</h2>
        <CreateUserForm
          sites={sites}
          departments={departments}
        />
      </div>
      <DataTable
        columns={columns}
        data={users}
        refreshDataKey="users"
        globalFilterColumns={USER_GLOBAL_FILTER_COLUMNS}
        quickFilters={USER_QUICK_FILTERS}
        onRowClick={setSelectedUser}
        getRowLabel={(user) => `Abrir ficha de ${user.fullName}`}
        onRowsRefresh={(rows) =>
          setSelectedUser((current) =>
            current ? rows.find((user) => user.id === current.id) ?? current : null,
          )
        }
        advancedFilters={[
          { param: "siteId", label: "Centro", type: "select", options: sites.map((site) => ({ value: site.id, label: site.name })) },
          { param: "departmentId", label: "Departamento", type: "select", options: departments.map((department) => ({ value: department.id, label: department.name })) },
          { param: "role", label: "Perfil", type: "select", options: [
            { value: "ADMIN", label: "Administración" },
            { value: "SECURITY_MANAGER", label: "Responsable de seguridad" },
            { value: "ACCESS_OPERATOR", label: "Operador" },
            { value: "ACCESS_MONITOR", label: "Monitor" },
            { value: "ACCESS_REQUESTER", label: "Solicitante" },
            { value: "ACCESS_APPROVER", label: "Aprobador" },
          ] },
        ]}
        serverFiltering
      />
      {selectedUser ? (
        <UserDetails
          user={selectedUser}
          sites={sites}
          departments={departments}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedUser(null);
          }}
          showTrigger={false}
        />
      ) : null}
    </div>
  );
}
