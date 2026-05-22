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
import type { Route } from "./+types/home";
import { getSessionSite } from "~/lib/session.server";
import { Badge } from "~/components/ui/badge";
import type { PlannedAccessStatus } from "../../../prisma/generated/prisma/client";
import type { AllowedAction } from "~/components/models/planned-access/planned-access-status-actions";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";

type EnrichedPlannedAccess = PlannedAccessListItem & {
  _entryStatus: {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
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

function getEntryStatusForRequest(
  status: PlannedAccessStatus,
  persons: PlannedAccessListItem["plannedAccessPersons"],
): EnrichedPlannedAccess["_entryStatus"] {
  switch (status) {
    case "PENDING_APPROVAL":
      return { label: "Pendiente de aprobación", variant: "secondary" };
    case "REJECTED":
      return { label: "Rechazada", variant: "destructive" };
    case "CANCELED":
      return { label: "Cancelada", variant: "outline" };
    case "EXPIRED":
      return { label: "Expirada", variant: "destructive" };
    case "USED":
      return { label: "Todos ingresaron", variant: "default" };
    case "APPROVED": {
      const totalPersons = persons.length;
      const entryCount = persons.filter((p) => (p.accessLogs?.length ?? 0) > 0).length;
      if (entryCount === totalPersons && totalPersons > 0) {
        return { label: "Todos ingresaron", variant: "default" };
      }
      if (entryCount > 0) {
        return { label: `${entryCount}/${totalPersons}`, variant: "secondary" };
      }
      return { label: "Sin ingreso", variant: "outline" };
    }
    case "PARTIALLY_USED": {
      const totalPersons = persons.length;
      const entryCount = persons.filter((p) => (p.accessLogs?.length ?? 0) > 0).length;
      return { label: `${entryCount}/${totalPersons}`, variant: "secondary" };
    }
    default:
      return { label: "Sin ingreso", variant: "outline" };
  }
}

function getEntryStatusColumns(): ReturnType<typeof plannedAccessColumns> {
  const baseColumns = plannedAccessColumns({
    actionPath: "/requester?index",
    allowedActions: REQUESTER_ALLOWED_ACTIONS,
  }) as ReturnType<typeof plannedAccessColumns>;

  const entryColumn = entryColHelper.display({
    id: "entryStatus",
    header: "Ingreso",
    cell: ({ row }) => {
      const entryStatus = row.original._entryStatus;
      return <Badge variant={entryStatus.variant}>{entryStatus.label}</Badge>;
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

  const plannedAccesses = await getManyPlannedAccesses({
    requestedById: user.id,
    siteId: sessionSite.id,
  });

  return { plannedAccesses, site: sessionSite };
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

  const enrichedAccesses = useMemo(() => {
    return (loaderData.plannedAccesses ?? []).map((pa) => ({
      ...pa,
      _entryStatus: getEntryStatusForRequest(pa.status, pa.plannedAccessPersons),
    }));
  }, [loaderData.plannedAccesses]);

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
