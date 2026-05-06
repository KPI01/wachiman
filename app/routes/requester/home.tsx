import { PlusIcon } from "lucide-react";
import { useMemo } from "react";
import z from "zod";
import DataTable from "~/components/ui/data-table";
import { validateUserRole } from "~/lib/auth.server";
import { getPlannedAccessColumns } from "~/lib/columns/planned-access";
import { PlannedAccessEntity } from "~/lib/database/planned-access.server";
import { createPlannedAccessSchema } from "~/lib/schemas/planned-access";
import CreatePlannedAccess from "~/components/models/planned-accesses/create-planned-access-form";
import RequesterPlannedAccessDetails from "./detail";
import type { Route } from "./+types/home";

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
  const user = await validateUserRole(request, "ACCESS_REQUESTER");

  const plannedAccesses = await PlannedAccessEntity.findMany();

  return { plannedAccesses };
}

export async function action({ request }: Route.ActionArgs) {
  await validateUserRole(request, "ACCESS_REQUESTER");

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

export default function RequesterHome({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const plannedAccesses = loaderData.plannedAccesses ?? [];

  const columns = useMemo(
    () =>
      getPlannedAccessColumns({
        renderActions: (plannedAccess) => (
          <RequesterPlannedAccessDetails plannedAccess={plannedAccess} />
        ),
      }),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CreatePlannedAccess
          errors={actionData?.errors}
          actionPath="/requester?index"
          buttonLabel={
            <>
              <PlusIcon />
              Nueva solicitud
            </>
          }
          title="Nueva solicitud de acceso"
          description="Indica el horario previsto, las personas y los vehiculos que requieren acceso."
          submitLabel="Solicitar"
        />
      </div>

      <DataTable
        columns={columns}
        data={plannedAccesses}
        globalFilterColumns={["status", "expectedStartDate", "expectedEndDate"]}
        empty={{
          title: "No hay solicitudes de acceso",
          description:
            "Crea una solicitud para empezar el proceso de aprobacion.",
        }}
      />
    </div>
  );
}
