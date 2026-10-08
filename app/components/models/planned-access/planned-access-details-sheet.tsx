import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import PlannedAccessStatusActions, {
  type AllowedAction,
} from "./planned-access-status-actions";
import type { AllowedArea, Site, WorkCategory } from "../../../../db/schema";
import type { PlannedAccessStatus } from "../../../../db/enums";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";
import { formatAccessDuration } from "~/lib/access-duration";
import { formatTimestamp } from "~/lib/utils";
import EditPlannedAccessForm from "./edit-planned-access-form";

const STATUS_LABELS: Record<PlannedAccessStatus, string> = {
  PENDING_APPROVAL: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  CANCELED: "Cancelada",
  EXPIRED: "Expirada",
  USED: "Usada",
  PARTIALLY_USED: "Parcialmente usada",
};

const STATUS_VARIANTS: Record<
  PlannedAccessStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING_APPROVAL: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELED: "outline",
  EXPIRED: "destructive",
  USED: "secondary",
  PARTIALLY_USED: "secondary",
};

function fullName(person: PlannedAccessListItem["plannedAccessPersons"][number]) {
  return [
    person.firstNameSnapshot,
    person.middleNameSnapshot,
    person.lastNameSnapshot,
    person.secondLastNameSnapshot,
  ]
    .filter(Boolean)
    .join(" ");
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="wrap-break-word text-sm">{children || "—"}</dd>
    </div>
  );
}

function formatDecision(value: string | undefined) {
  switch (value) {
    case "APPROVED":
      return "Aprobado";
    case "DENIED":
      return "Denegado";
    case "NOT_REQUIRED":
      return "No requerido";
    case "PENDING":
      return "Pendiente";
    default:
      return "—";
  }
}

export function getPlannedAccessRowLabel(
  plannedAccess: PlannedAccessListItem,
) {
  const start = formatTimestamp({
    date: plannedAccess.expectedStartDatetime,
    template: "dd/MM/yyyy HH:mm",
  });
  return `Abrir detalles de solicitud de ${plannedAccess.companySnapshot}, ${start}`;
}

export default function PlannedAccessDetailsSheet({
  plannedAccess,
  onClose,
  actionPath,
  allowedActions,
  canChangeSite = false,
  showSiteRiskInformation = true,
  sites,
  workCategories,
  allowedAreas,
}: {
  plannedAccess: PlannedAccessListItem | null;
  onClose: () => void;
  actionPath: string;
  allowedActions?: AllowedAction[];
  canChangeSite?: boolean;
  showSiteRiskInformation?: boolean;
  sites?: Array<Pick<Site, "id" | "name">>;
  workCategories?: Array<Pick<WorkCategory, "id" | "name">>;
  allowedAreas?: Array<Pick<AllowedArea, "id" | "name" | "siteId">>;
}) {
  const [editingAccessId, setEditingAccessId] = useState<string | null>(null);
  const status = plannedAccess?.status ?? "PENDING_APPROVAL";
  const isEditing = plannedAccess?.id === editingAccessId;
  const actions = allowedActions ?? ["EDIT", "APPROVE", "REJECT", "CANCEL"];
  const canTakeAction =
    (status === "PENDING_APPROVAL" && actions.length > 0) ||
    (status === "APPROVED" && actions.includes("CANCEL"));

  return (
    <Dialog
      open={plannedAccess !== null}
      onOpenChange={(open) => {
        if (!open) {
          setEditingAccessId(null);
          onClose();
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl gap-0 overflow-hidden p-0">
        {plannedAccess ? (
          <>
            <DialogHeader className="shrink-0 gap-2 border-b px-6 py-5 pr-14">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-xl">
                  {isEditing ? "Editar solicitud de acceso" : "Detalles de solicitud"}
                </DialogTitle>
                <Badge variant={STATUS_VARIANTS[status]}>
                  {STATUS_LABELS[status]}
                </Badge>
              </div>
              <DialogDescription>
                {plannedAccess.companySnapshot} · {plannedAccess.site?.name ?? "Centro sin especificar"}
              </DialogDescription>
            </DialogHeader>

            {isEditing ? (
              <EditPlannedAccessForm
                plannedAccess={plannedAccess}
                sites={sites ?? []}
                workCategories={workCategories ?? []}
                allowedAreas={allowedAreas ?? []}
                actionPath={actionPath}
                canChangeSite={canChangeSite}
                inline
                onCancel={() => setEditingAccessId(null)}
                onSuccess={() => setEditingAccessId(null)}
              />
            ) : (
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Planificación</h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="Inicio previsto">
                    {formatTimestamp({
                      date: plannedAccess.expectedStartDatetime,
                      template: "dd/MM/yyyy HH:mm",
                    })}
                  </DetailField>
                  <DetailField label="Fin previsto">
                    {plannedAccess.expectedEndDatetime
                      ? formatTimestamp({
                          date: plannedAccess.expectedEndDatetime,
                          template: "dd/MM/yyyy HH:mm",
                        })
                      : "Sin fecha de fin"}
                  </DetailField>
                  <DetailField label="Centro">
                    {plannedAccess.site?.name ?? "—"}
                  </DetailField>
                  <DetailField label="Dirección del centro">
                    {plannedAccess.site?.address ?? "—"}
                  </DetailField>
                  {showSiteRiskInformation && plannedAccess.site?.riskInformation ? (
                    <div className="sm:col-span-2">
                      <DetailField label="Información de riesgos del centro">
                        {plannedAccess.site.riskInformation}
                      </DetailField>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section className="space-y-3 border-t pt-5">
                <h3 className="text-sm font-semibold">Empresa y solicitud</h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="Empresa">
                    {plannedAccess.company?.name ?? plannedAccess.companySnapshot}
                    {!plannedAccess.companyId && (plannedAccess.status ?? "PENDING_APPROVAL") === "PENDING_APPROVAL" ? (
                      <Badge variant="outline">Empresa pendiente de validar</Badge>
                    ) : null}
                  </DetailField>
                  <DetailField label="CIF">
                    {plannedAccess.company?.cif ?? "—"}
                  </DetailField>
                  <DetailField label="Dirección de la empresa">
                    {plannedAccess.company?.address ?? "—"}
                  </DetailField>
                  <DetailField label="Solicitada por">
                    {plannedAccess.requestedBy?.fullName ?? "—"}
                  </DetailField>
                  <div className="sm:col-span-2">
                    <DetailField label="Motivo de la visita">
                      {plannedAccess.visitReason}
                    </DetailField>
                  </div>
                  <DetailField label="Creada">
                    {formatTimestamp({
                      date: plannedAccess.createdAt,
                      template: "dd/MM/yyyy HH:mm",
                    })}
                  </DetailField>
                  <DetailField label="Última actualización">
                    {formatTimestamp({
                      date: plannedAccess.updatedAt,
                      template: "dd/MM/yyyy HH:mm",
                    })}
                  </DetailField>
                </dl>
              </section>

              {plannedAccess.approvedAt || plannedAccess.decisionReason ? (
                <section className="space-y-3 border-t pt-5">
                  <h3 className="text-sm font-semibold">Decisión</h3>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {plannedAccess.approvedBy?.fullName ? (
                      <DetailField label="Aprobada por">
                        {plannedAccess.approvedBy.fullName}
                      </DetailField>
                    ) : null}
                    {plannedAccess.approvedAt ? (
                      <DetailField label="Fecha de aprobación">
                        {formatTimestamp({
                          date: plannedAccess.approvedAt,
                          template: "dd/MM/yyyy HH:mm",
                        })}
                      </DetailField>
                    ) : null}
                    {plannedAccess.decisionAt ? (
                      <DetailField label="Fecha de decisión">
                        {formatTimestamp({
                          date: plannedAccess.decisionAt,
                          template: "dd/MM/yyyy HH:mm",
                        })}
                      </DetailField>
                    ) : null}
                    {plannedAccess.decisionReason ? (
                      <div className="sm:col-span-2">
                        <DetailField label="Motivo de rechazo o cancelación">
                          {plannedAccess.decisionReason}
                        </DetailField>
                      </div>
                    ) : null}
                  </dl>
                </section>
              ) : null}

              <section className="space-y-3 border-t pt-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Visitantes</h3>
                  <span className="text-xs text-muted-foreground">
                    {plannedAccess.plannedAccessPersons.length} en total
                  </span>
                </div>
                <div className="space-y-3">
                  {plannedAccess.plannedAccessPersons.map((person) => (
                    <article
                      key={person.id}
                      className="space-y-4 rounded-lg border p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-medium">{fullName(person)}</h4>
                          <p className="text-xs text-muted-foreground">
                            Identificación: {person.legalIdSnapshot}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {formatAccessDuration(person.presenceDurationMs)}
                        </Badge>
                      </div>
                      <dl className="grid gap-4 sm:grid-cols-2">
                        <DetailField label="Teléfono">
                          {person.phoneNumber ?? "—"}
                        </DetailField>
                        <DetailField label="Tipo de trabajo">
                          {person.workCategory?.name ?? "Sin tipo de trabajo"}
                        </DetailField>
                        <DetailField label="Área autorizada">
                          {person.allowedArea?.name ?? person.allowedAreaSnapshot}
                        </DetailField>
                        <DetailField label="Decisión de acceso">
                          {formatDecision(person.decision?.accessDecision)}
                        </DetailField>
                        <DetailField label="Decisión del trabajo">
                          {formatDecision(person.decision?.workDecision)}
                        </DetailField>
                        {person.decision?.decisionReason ? (
                          <div className="sm:col-span-2">
                            <DetailField label="Motivo de la decisión individual">
                              {person.decision.decisionReason}
                            </DetailField>
                          </div>
                        ) : null}
                        {person.workCategory?.riskInformation ? (
                          <div className="sm:col-span-2">
                            <DetailField label="Información de riesgos del trabajo">
                              {person.workCategory.riskInformation}
                            </DetailField>
                          </div>
                        ) : null}
                      </dl>
                      {person.accessLogs.length ? (
                        <div className="space-y-2 border-t pt-3">
                          <p className="text-xs font-medium text-muted-foreground">
                            Registros de acceso
                          </p>
                          {person.accessLogs.map((accessLog) => (
                            <div
                              key={accessLog.id}
                              className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs"
                            >
                              <span>
                                Entrada: {formatTimestamp({
                                  date: accessLog.entryTimestamp,
                                  template: "dd/MM/yyyy HH:mm",
                                })}
                              </span>
                              <span className="text-muted-foreground">
                                {accessLog.exitTimestamp
                                  ? `Salida: ${formatTimestamp({ date: accessLog.exitTimestamp, template: "dd/MM/yyyy HH:mm" })}`
                                  : "Sin salida registrada"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            </div>
            )}

            {!isEditing ? <div className="border-t bg-background px-6 py-4">
              {canTakeAction ? (
                <PlannedAccessStatusActions
                  plannedAccessId={plannedAccess.id}
                  status={status}
                  actionPath={actionPath}
                  allowedActions={allowedActions}
                  onEdit={() => setEditingAccessId(plannedAccess.id)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay acciones disponibles para esta solicitud.
                </p>
              )}
            </div> : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
