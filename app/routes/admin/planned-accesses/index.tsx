import { useMemo } from "react";
import { PlannedAccessEntity } from "~/lib/database/planned-access.server";
import { UserEntity } from "~/lib/database/user.server";
import type { Route } from "./+types";
import DataTable from "~/components/ui/data-table";
import { getPlannedAccessColumns } from "~/lib/columns/planned-access";
import CreatePlannedAccess from "./create";
import z from "zod";
import {
  createPlannedAccessSchema,
  updatePlannedAccessSchema,
} from "~/lib/schemas/planned-access";
import { validateUserRole } from "~/lib/auth.server";

function parseFormDataArrays<T extends Record<string, string>>(
  formData: FormData,
  prefix: string,
  fields: string[],
): T[] {
  const items: T[] = [];
  let i = 0;
  while (formData.has(`${prefix}[${i}][${fields[0]}]`)) {
    const item = {} as Record<string, string>;
    for (const field of fields) {
      const value = formData.get(`${prefix}[${i}][${field}]`);
      item[field] = typeof value === "string" ? value : "";
    }
    items.push(item as T);
    i++;
  }
  return items;
}

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ADMIN");

  const [plannedAccesses, users] = await Promise.all([
    PlannedAccessEntity.findMany(),
    UserEntity.getAll(),
  ]);

  return { plannedAccesses, users };
}

export async function action({ request }: Route.ActionArgs) {
  await validateUserRole(request, "ADMIN");
  if (request.method === "PATCH") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } =
      await updatePlannedAccessSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    const { id, ...dataWithoutId } = data;

    await PlannedAccessEntity.update(id, dataWithoutId);

    const persons = parseFormDataArrays(rawFormData, "persons", [
      "firstNameSnapshot",
      "middleNameSnapshot",
      "lastNameSnapshot",
      "secondLastNameSnapshot",
      "legalIdSnapshot",
    ]);

    const vehicles = parseFormDataArrays(rawFormData, "vehicles", [
      "typeSnapshot",
      "brandSnapshot",
      "modelSnapshot",
      "plateSnapshot",
    ]);

    if (persons.length > 0) {
      await PlannedAccessEntity.addPersons(id, persons);
    }

    if (vehicles.length > 0) {
      await PlannedAccessEntity.addVehicles(id, vehicles);
    }

    return { success: true };
  }

  const rawFormData = await request.formData();

  const persons = parseFormDataArrays(rawFormData, "persons", [
    "firstNameSnapshot",
    "middleNameSnapshot",
    "lastNameSnapshot",
    "secondLastNameSnapshot",
    "legalIdSnapshot",
  ]);

  const vehicles = parseFormDataArrays(rawFormData, "vehicles", [
    "typeSnapshot",
    "brandSnapshot",
    "modelSnapshot",
    "plateSnapshot",
  ]);

  const jsonData = {
    expectedStartDate: rawFormData.get("expectedStartDate"),
    expectedEndDate: rawFormData.get("expectedEndDate"),
    persons,
    vehicles,
  };

  const { error, data, success } =
    await createPlannedAccessSchema.safeParseAsync(jsonData);

  if (error) {
    return { errors: z.treeifyError(error) };
  }

  await PlannedAccessEntity.create(data);

  return { success };
}

export default function IndexPlannedAccesses({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const columns = useMemo(() => getPlannedAccessColumns(), []);

  return (
    <div className="grid space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Solicitudes de Acceso</h2>

        <CreatePlannedAccess errors={actionData?.errors} />
      </div>
      <DataTable
        columns={columns}
        data={loaderData.plannedAccesses ?? []}
        globalFilterColumns={["status"]}
      />
    </div>
  );
}
