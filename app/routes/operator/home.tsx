import DataTable from "~/components/ui/data-table";
import CreateAccessLogForm from "~/components/models/access-logs/create-access-log-form";
import { getAccessLogColumns } from "~/lib/columns/access-log";
import {
  createAccessLog,
  getManyAccessLogs,
} from "~/lib/services/access-log.server";
import { getSessionSite } from "~/lib/session.server";
import type { Route } from "./+types/home";
import { validateUserRole } from "~/lib/auth.server";
import { getFormData } from "~/lib/services/http.server";
import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  createAccessLogFromPlannedAccess,
  getManyPlannedAccesses,
} from "~/lib/services/planned-access.server";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "~/components/ui/empty";
import { formatTimestamp } from "~/lib/utils";
import PlannedAccessPersonSignatureAction from "~/components/models/planned-access/planned-access-person-signature-action";
import CardContainer from "~/components/containers/card-container";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ACCESS_OPERATOR");
  const sessionSite = await getSessionSite(request);

  if (!sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const [accessLogs, plannedAccesses] = await Promise.all([
    getManyAccessLogs({
      siteId: sessionSite.id,
      timestampField: "entryTimestamp",
      date: new Date(),
    }),
    getManyPlannedAccesses({
      siteId: sessionSite.id,
      status: ["APPROVED", "PARTIALLY_USED"],
      expectedDate: new Date(),
    }),
  ]);

  return {
    accessLogs,
    plannedAccesses,
    site: sessionSite,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ACCESS_OPERATOR");
  const sessionSite = await getSessionSite(request);

  if (!sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const data = await getFormData(request);

  if (data.intent === "planned-access-signature") {
    return await createAccessLogFromPlannedAccess(data, {
      authorUsername: user.username,
      lockedSiteId: sessionSite.id,
    });
  }

  const result = await createAccessLog(data, {
    authorUsername: user.username,
    lockedSiteId: sessionSite.id,
  });

  return {
    success: result.success,
    errors: result.errors,
  };
}

function getPersonFullName(
  person: PlannedAccessListItem["plannedAccessPersons"][number],
) {
  return [
    person.firstNameSnapshot,
    person.middleNameSnapshot,
    person.lastNameSnapshot,
    person.secondLastNameSnapshot,
  ]
    .filter(Boolean)
    .join(" ");
}

function getPlannedAccessTimeRange(plannedAccess: PlannedAccessListItem) {
  const start = formatTimestamp({
    date: plannedAccess.expectedStartDatetime,
    template: "HH:mm",
  });

  if (!plannedAccess.expectedEndDatetime) {
    return `${start} (Todo el dia)`;
  }

  return `${start} - ${formatTimestamp({
    date: plannedAccess.expectedEndDatetime,
    template: "HH:mm",
  })}`;
}

function PlannedAccessesToday({
  plannedAccesses,
  registeredLegalIds,
}: {
  plannedAccesses: PlannedAccessListItem[];
  registeredLegalIds: Set<string>;
}) {
  if (plannedAccesses.length === 0) {
    return (
      <div className="overflow-hidden rounded-md border">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No hay accesos planificados aprobados</EmptyTitle>
            <EmptyDescription>
              Las solicitudes aprobadas para el dia actual apareceran aqui.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {plannedAccesses.map((plannedAccess) => (
        <CardContainer
          key={plannedAccess.id}
          title={plannedAccess.companySnapshot}
          description={`${getPlannedAccessTimeRange(plannedAccess)} | ${plannedAccess.visitReason}`}
        >
          {plannedAccess.plannedAccessPersons.map((person) => {
            const hasRegisteredAccess = registeredLegalIds.has(
              person.legalIdSnapshot.toUpperCase(),
            );

            return (
              <div
                key={person.id}
                className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">
                      {getPersonFullName(person)}
                    </p>
                    <Badge
                      variant={hasRegisteredAccess ? "secondary" : "outline"}
                    >
                      {hasRegisteredAccess
                        ? "Ingreso registrado"
                        : "Pendiente de firma"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    DNI/NIE: {person.legalIdSnapshot}
                    {person.phoneNumber
                      ? ` · Telefono: ${person.phoneNumber}`
                      : ""}
                  </p>
                </div>
                <PlannedAccessPersonSignatureAction
                  plannedAccessId={plannedAccess.id}
                  person={person}
                  disabled={hasRegisteredAccess}
                />
              </div>
            );
          })}
        </CardContainer>
      ))}
    </div>
  );
}

export default function OperatorHome({ loaderData }: Route.ComponentProps) {
  const columns = useMemo(
    () => getAccessLogColumns(["vehicleDetails", "visitReason", "actions"]),
    [],
  );
  const registeredLegalIds = useMemo(
    () =>
      new Set(
        (loaderData.accessLogs ?? []).map((accessLog) =>
          accessLog.legalIdSnapshot.toUpperCase(),
        ),
      ),
    [loaderData.accessLogs],
  );

  return (
    <Tabs defaultValue="access-logs" className="w-full">
      <TabsList>
        <TabsTrigger value="access-logs">Accesos</TabsTrigger>
        <TabsTrigger value="planned-access">Planificados de hoy</TabsTrigger>
      </TabsList>

      <TabsContent value="access-logs" className="flex flex-col gap-6">
        <div className="flex justify-end">
          <CreateAccessLogForm
            sites={[loaderData.site]}
            actionPath="/operator?index"
            lockedSiteId={loaderData.site.id}
            buttonLabel="Registrar acceso"
          />
        </div>

        <DataTable
          columns={columns}
          data={loaderData.accessLogs ?? []}
          showGlobalFilter={false}
          showColumnVisibility={false}
          empty={{
            title: "No hay accesos registrados hoy",
            description:
              "Los accesos del centro para la fecha actual apareceran aqui.",
          }}
        />
      </TabsContent>

      <TabsContent value="planned-access" className="flex flex-col gap-4">
        <PlannedAccessesToday
          plannedAccesses={loaderData.plannedAccesses ?? []}
          registeredLegalIds={registeredLegalIds}
        />
      </TabsContent>
    </Tabs>
  );
}
