import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import CreatePlannedAccessForm from "~/components/models/planned-access/create-planned-access-form";
import DataTable from "~/components/ui/data-table";
import { plannedAccessColumns } from "~/lib/columns/planned-access";
import { validateUserRole } from "~/lib/auth.server";
import {
  createPlannedAccess,
  getManyPlannedAccesses,
  getPlannedAccessFormInput,
  updatePlannedAccessStatus,
} from "~/lib/services/planned-access.server";
import { getManyAccessLogs } from "~/lib/services/access-log.server";
import type { Route } from "./+types/home";
import { getSessionSite } from "~/lib/session.server";
import { Badge } from "~/components/ui/badge";
import type { AllowedAction } from "~/components/models/planned-access/planned-access-status-actions";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";

type EnrichedPlannedAccess = PlannedAccessListItem & {
  _entryStatus: {
    totalPersons: number;
    entryCount: number;
    allEntered: boolean;
    someEntered: boolean;
    noneEntered: boolean;
  };
};

const REQUESTER_ALLOWED_ACTIONS: AllowedAction[] = ["CANCEL"];

const PLANNED_ACCESS_GLOBAL_FILTER_COLUMNS = [
  "companySnapshot",
  "visitReason",
  "personsDetails",
  "siteName",
];

const entryColHelper = createColumnHelper<EnrichedPlannedAccess>();

function getEntryStatusColumns(): ReturnType<typeof plannedAccessColumns> {
  const baseColumns = plannedAccessColumns({
    actionPath: "/requester?index",
    allowedActions: REQUESTER_ALLOWED_ACTIONS,
  }) as ReturnType<typeof plannedAccessColumns>;

  const entryColumn = entryColHelper.display({
    id: "entryStatus",
    header: "Ingreso",
    cell: ({ row }) => {
      const status = row.original._entryStatus;
      if (status.allEntered) {
        return <Badge variant="default">Todos ingresaron</Badge>;
      }
      if (status.someEntered) {
        return (
          <Badge variant="secondary">
            {status.entryCount}/{status.totalPersons}
          </Badge>
        );
      }
      return <Badge variant="outline">Sin ingreso</Badge>;
    },
  });

  const actionsIndex = baseColumns.findIndex((col) => col.id === "actions");
  if (actionsIndex >= 0) {
    baseColumns.splice(actionsIndex, 0, entryColumn as typeof baseColumns[number]);
  } else {
    baseColumns.push(entryColumn as typeof baseColumns[number]);
  }

  return baseColumns;
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await validateUserRole(request, "ACCESS_REQUESTER");
  const sessionSite = await getSessionSite(request);

  if (!sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const [plannedAccesses, accessLogs] = await Promise.all([
    getManyPlannedAccesses({
      requestedById: user.id,
      siteId: sessionSite.id,
    }),
    getManyAccessLogs({
      siteId: sessionSite.id,
      timestampField: "entryTimestamp",
      date: new Date(),
    }),
  ]);

  return { plannedAccesses, accessLogs, site: sessionSite };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ACCESS_REQUESTER");
  const sessionSite = await getSessionSite(request);

  if (!sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const method = request.method.toUpperCase();
  const rawFormData = await request.formData();

  if (method === "POST") {
    return await createPlannedAccess(getPlannedAccessFormInput(rawFormData), {
      authorUsername: user.username,
      lockedSiteId: sessionSite.id,
    });
  }

  if (method === "PUT" || method === "PATCH") {
    return await updatePlannedAccessStatus(Object.fromEntries(rawFormData), {
      authorUsername: user.username,
    });
  }

  return null;
}

export default function RequesterHome({ loaderData }: Route.ComponentProps) {
  const columns = getEntryStatusColumns();
  const registeredLegalIds = useMemo(
    () =>
      new Set(
        (loaderData.accessLogs ?? []).map((accessLog) =>
          accessLog.legalIdSnapshot.toUpperCase(),
        ),
      ),
    [loaderData.accessLogs],
  );

  const enrichedAccesses = useMemo(() => {
    return (loaderData.plannedAccesses ?? []).map((pa) => {
      const personsWithEntry = pa.plannedAccessPersons.filter((person) =>
        registeredLegalIds.has(person.legalIdSnapshot.toUpperCase()),
      );
      const totalPersons = pa.plannedAccessPersons.length;
      const entryCount = personsWithEntry.length;

      return {
        ...pa,
        _entryStatus: {
          totalPersons,
          entryCount,
          allEntered: entryCount === totalPersons && totalPersons > 0,
          someEntered: entryCount > 0 && entryCount < totalPersons,
          noneEntered: entryCount === 0,
        },
      };
    });
  }, [loaderData.plannedAccesses, registeredLegalIds]);

  return (
    <div className="grid space-y-6">
      <div className="flex items-center justify-end">
        <CreatePlannedAccessForm
          sites={[loaderData.site]}
          actionPath="/requester?index"
          lockedSiteId={loaderData.site.id}
        />
      </div>
      <DataTable
        columns={columns}
        data={enrichedAccesses}
        globalFilterColumns={PLANNED_ACCESS_GLOBAL_FILTER_COLUMNS}
        empty={{
          title: "No hay solicitudes de acceso",
          description: "Tus solicitudes de acceso apareceran aqui.",
        }}
        filterPlaceholder="Escribe aqui para empezar a buscar..."
      />
    </div>
  );
}
