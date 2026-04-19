import z from "zod";
import DataTable from "~/components/ui/data-table";
import { accessLogColumns } from "~/lib/columns/access-log";
import { createAccessLog, getAccessLogs } from "~/lib/database/access-log";
import { getSites } from "~/lib/database/site";
import { getUserByUsername } from "~/lib/database/user";
import { createAccessLogSchema } from "~/lib/schemas/access-log";
import { getSessionUser } from "~/lib/session";
import CreateAccessLog from "./create";
import type { Route } from "./+types/index";

export async function loader() {
  const [accessLogs, sites] = await Promise.all([getAccessLogs(), getSites()]);

  return { accessLogs, sites };
}

export async function action({ request }: Route.ActionArgs) {
  const start = performance.now();

  try {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);

    const { error, data, success } =
      await createAccessLogSchema.safeParseAsync(jsonData);

    if (error) {
      return { errors: z.treeifyError(error) };
    }

    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      throw new Response("Unauthorized", { status: 401 });
    }

    const createdBy = await getUserByUsername(sessionUser.username);

    if (!createdBy) {
      throw new Response("Unauthorized", { status: 401 });
    }

    await createAccessLog({
      entryTimestamp: data.entryTimestamp,
      companyNameSnapshot: data.companyNameSnapshot,
      firstNameSnapshot: data.firstNameSnapshot,
      middleNameSnapshot: data.middleNameSnapshot,
      lastNameSnapshot: data.lastNameSnapshot,
      secondLastNameSnapshot: data.secondLastNameSnapshot,
      phoneNumber: data.phoneNumber,
      legalIdSnapshot: data.legalIdSnapshot,
      visitReason: data.visitReason,
      siteId: data.siteId,
      withVehicle: data.withVehicle,
      createdById: createdBy.id,
      vehicle: data.withVehicle
        ? {
            typeSnapshot: data.vehicleTypeSnapshot ?? "",
            brandSnapshot: data.vehicleBrandSnapshot,
            modelSnapshot: data.vehicleModelSnapshot,
            plateSnapshot: data.vehiclePlateSnapshot ?? "",
          }
        : undefined,
    });

    return { success };
  } finally {
    console.log(`[/access-logs] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export default function IndexAccessLogs({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Registros de acceso</h2>

        <CreateAccessLog sites={loaderData.sites ?? []} />
      </div>
      <DataTable
        columns={accessLogColumns}
        data={loaderData.accessLogs ?? []}
        globalFilterColumns={[
          "fullNameSnapshot",
          "legalIdSnapshot",
          "companyNameSnapshot",
          "vehicleDetails",
        ]}
        empty={{
          title: "No hay accesos registrados",
          description: "Los registros de acceso creados apareceran aqui.",
        }}
      />
    </div>
  );
}
