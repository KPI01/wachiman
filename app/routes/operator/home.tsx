import DataTable from "~/components/ui/data-table";
import CreateAccessLogForm from "~/components/models/access-logs/create-access-log-form";
import { getAccessLogColumns } from "~/lib/columns/access-log";
import {
  createAccessLog,
  getManyAccessLogs,
  getOpenAccessLogs,
} from "~/lib/services/access-log.server";
import { getSessionSite } from "~/lib/session.server";
import type { Route } from "./+types/home";
import { validateUserRole } from "~/lib/auth.server";
import { getFormData } from "~/lib/services/http.server";
import { useEffect, useMemo } from "react";
import { useRevalidator } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  createAccessLogFromPlannedAccess,
  getManyPlannedAccesses,
} from "~/lib/services/planned-access.server";
import {
  signWorkPermit,
  getApprovedWorkPermitsForSiteOnDate,
} from "~/lib/services/work-permit.server";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";
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
import StaleAccessWarning from "~/components/models/access-logs/stale-access-warning";
import { getManyAllowedAreas } from "~/lib/services/allowed-area.server";
import { formatAccessDuration } from "~/lib/access-duration";
import { getGlobalAppSettings } from "~/lib/services/app-settings.server";
import { SiteEntity } from "~/lib/database/site.server";
import { getManyCompanies } from "~/lib/services/company.server";
import { getAppConfig } from "~/lib/app-config.server";

export async function loader({ request }: Route.LoaderArgs) {
  await validateUserRole(request, "ACCESS_OPERATOR");
  const sessionSite = await getSessionSite(request);

  if (!sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const { workPermitsEnabled } = getAppConfig();
  const [accessLogs, plannedAccesses, openAccessLogs, allowedAreas, settings, site, companies, approvedWorkPermits] = await Promise.all([
    getManyAccessLogs({
      siteId: sessionSite.id,
      timestampField: "entryTimestamp",
      date: new Date(),
    }),
    getManyPlannedAccesses({
      siteId: sessionSite.id,
      status: ["APPROVED", "PARTIALLY_USED", "USED"],
      expectedDate: new Date(),
    }),
    getOpenAccessLogs({ siteId: sessionSite.id }),
    getManyAllowedAreas(),
    getGlobalAppSettings(),
    SiteEntity.findById(sessionSite.id),
    getManyCompanies(),
    workPermitsEnabled
      ? getApprovedWorkPermitsForSiteOnDate(sessionSite.id, new Date())
      : Promise.resolve([]),
  ]);

  if (!site) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return {
    accessLogs,
    plannedAccesses,
    openAccessLogs,
    site,
    allowedAreas,
    holder: settings ? { legalName: settings.holderLegalName ?? "", taxId: settings.holderTaxId ?? "", fiscalAddress: settings.holderFiscalAddress ?? "" } : undefined,
    companies,
    workPermitsEnabled,
    workPermits: approvedWorkPermits.map((workPermit) => ({
      personId: workPermit.plannedAccessPersonId,
      externalWorkerId: workPermit.externalWorkerId,
      workPermit,
    })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ACCESS_OPERATOR");
  const sessionSite = await getSessionSite(request);

  if (!sessionSite) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const { workPermitsEnabled } = getAppConfig();
  const data = await getFormData(request);

  if (workPermitsEnabled && data.workPermitId && data.workPermitSignaturePayload) {
    const permitResult = await signWorkPermit(
      {
        workPermitId: data.workPermitId,
        signaturePayload: data.workPermitSignaturePayload,
      },
      { authorUsername: user.username, lockedSiteId: sessionSite.id },
    );
    if (!permitResult.success) return permitResult;
  }

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
  openLegalIds,
  site,
  holder,
  dailyRiskAcknowledgements,
  workPermits,
  workPermitsEnabled,
}: {
  plannedAccesses: PlannedAccessListItem[];
  openLegalIds: Set<string>;
  site: NonNullable<Awaited<ReturnType<typeof SiteEntity.findById>>>;
  holder?: { legalName: string; taxId: string; fiscalAddress: string };
  dailyRiskAcknowledgements: Array<{ legalIdSnapshot: string; companyId: string | null; siteId: string; riskAcknowledgedAt: Date | null }>;
  workPermits: Array<{
    personId: string;
    externalWorkerId: string | null;
    workPermit: Awaited<ReturnType<typeof getApprovedWorkPermitsForSiteOnDate>>[number];
  }>;
  workPermitsEnabled: boolean;
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
            const isInside = openLegalIds.has(
              person.legalIdSnapshot.toUpperCase(),
            );
            const accessDenied = person.decision?.accessDecision === "DENIED";
            const workDenied = person.decision?.workDecision === "DENIED";
            const workPermit = workPermits.find((item) => item.personId === person.id)?.workPermit;
            const missingWorkPermit = Boolean(
              workPermitsEnabled &&
                person.workCategory?.requiresWorkPermit &&
                !workPermit,
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
                      variant={
                        accessDenied
                          ? "destructive"
                          : isInside
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {isInside
                        ? "Dentro"
                        : accessDenied
                          ? "Acceso denegado"
                          : missingWorkPermit
                            ? "Permiso de trabajo pendiente"
                            : workDenied
                              ? "Acceso permitido, trabajo no autorizado"
                              : person.accessLogs.length > 0
                                ? "Reingreso disponible"
                                : "Pendiente de firma"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    DNI/NIE: {person.legalIdSnapshot}
                    {person.phoneNumber
                      ? ` · Telefono: ${person.phoneNumber}`
                      : ""}
                    <br />
                    Permanencia acumulada: {formatAccessDuration(person.presenceDurationMs)}
                  </p>
                  {person.decision?.decisionReason ? (
                    <p className="text-sm text-destructive">
                      Motivo: {person.decision.decisionReason}
                    </p>
                  ) : null}
                </div>
                <PlannedAccessPersonSignatureAction
                  plannedAccessId={plannedAccess.id}
                  person={person}
                  disabled={isInside || accessDenied}
                  site={site}
                  holder={holder}
                  company={plannedAccess.company ?? undefined}
                  workPermit={workPermit}
                  requiresWorkPermit={Boolean(
                    workPermitsEnabled && person.workCategory?.requiresWorkPermit,
                  )}
                  dailyRiskAcknowledgements={dailyRiskAcknowledgements}
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
    () => getAccessLogColumns(["vehicleDetails", "visitReason", "actions"], loaderData.allowedAreas ?? []),
    [loaderData.allowedAreas],
  );
  const openLegalIds = useMemo(
    () =>
      new Set(
        (loaderData.openAccessLogs ?? []).map((accessLog) =>
          accessLog.legalIdSnapshot.toUpperCase(),
        ),
      ),
    [loaderData.openAccessLogs],
  );

  const revalidator = useRevalidator();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        revalidator.state === "idle"
      ) {
        revalidator.revalidate();
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [revalidator]);

  return (
    <Tabs defaultValue="access-logs" className="w-full">
      <StaleAccessWarning accessLogs={loaderData.openAccessLogs ?? []} allowExit />
      <TabsList>
        <TabsTrigger value="access-logs">Accesos</TabsTrigger>
        <TabsTrigger value="planned-access">Planificados de hoy</TabsTrigger>
      </TabsList>

      <TabsContent value="access-logs" className="flex flex-col gap-6">
        <div className="flex justify-end">
          <CreateAccessLogForm
            sites={[loaderData.site]}
            allowedAreas={loaderData.allowedAreas ?? []}
            actionPath="/operator?index"
            lockedSiteId={loaderData.site.id}
            buttonLabel="Registrar acceso"
            holder={loaderData.holder}
            companies={loaderData.companies ?? []}
            workPermits={loaderData.workPermits ?? []}
            dailyRiskAcknowledgements={(loaderData.accessLogs ?? []).map((log) => ({ legalIdSnapshot: log.legalIdSnapshot, companyId: log.companyId, siteId: log.siteId, riskAcknowledgedAt: log.riskAcknowledgedAt }))}
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
          openLegalIds={openLegalIds}
          site={loaderData.site}
          holder={loaderData.holder}
          dailyRiskAcknowledgements={(loaderData.accessLogs ?? []).map((log) => ({
            legalIdSnapshot: log.legalIdSnapshot,
            companyId: log.companyId,
            siteId: log.siteId,
            riskAcknowledgedAt: log.riskAcknowledgedAt,
          }))}
          workPermits={loaderData.workPermits ?? []}
          workPermitsEnabled={loaderData.workPermitsEnabled ?? false}
        />
      </TabsContent>
    </Tabs>
  );
}
