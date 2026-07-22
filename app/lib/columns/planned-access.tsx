import { createColumnHelper } from "@tanstack/react-table";
import type { AllowedAction } from "~/components/models/planned-access/planned-access-status-actions";
import type { ComponentProps } from "react";
import type { PlannedAccessStatus } from "../../../db/enums";
import PlannedAccessStatusActions from "~/components/models/planned-access/planned-access-status-actions";
import { Badge } from "~/components/ui/badge";
import type { PlannedAccessListItem } from "../database/planned-access.server";
import { formatTimestamp } from "../utils";

const plannedAccessColHelper = createColumnHelper<PlannedAccessListItem>();

const PLANNED_ACCESS_STATUS_LABELS: Record<PlannedAccessStatus, string> = {
  PENDING_APPROVAL: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  CANCELED: "Cancelada",
  EXPIRED: "Expirada",
  USED: "Usada",
  PARTIALLY_USED: "Parcialmente usada",
};

const PLANNED_ACCESS_STATUS_VARIANTS: Record<
  PlannedAccessStatus,
  ComponentProps<typeof Badge>["variant"]
> = {
  PENDING_APPROVAL: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELED: "outline",
  EXPIRED: "destructive",
  USED: "secondary",
  PARTIALLY_USED: "secondary",
};

function getFullName(
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

function getPersonsDetails(plannedAccess: PlannedAccessListItem) {
  return plannedAccess.plannedAccessPersons
    .map((person) => `${getFullName(person)} (${person.legalIdSnapshot})`)
    .join(", ");
}

export const plannedAccessColumns = ({
  actionPath,
  allowedActions,
}: {
  actionPath?: string;
  allowedActions?: AllowedAction[];
} = {}) => [
    plannedAccessColHelper.accessor("expectedStartDatetime", {
      header: "Inicio previsto",
      cell: ({ getValue }) =>
        formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
    }),
    plannedAccessColHelper.accessor("expectedEndDatetime", {
      header: "Fin previsto",
      cell: ({ getValue }) => {
        const value = getValue();

        return value
          ? formatTimestamp({ date: value, template: "dd/MM/yyyy HH:mm" })
          : "Todo el dia";
      },
    }),
    plannedAccessColHelper.accessor("status", {
      header: "Estado",
      cell: ({ getValue }) => {
        const status = getValue() ?? "PENDING_APPROVAL";

        return (
          <Badge variant={PLANNED_ACCESS_STATUS_VARIANTS[status]}>
            {PLANNED_ACCESS_STATUS_LABELS[status]}
          </Badge>
        );
      },
    }),
    plannedAccessColHelper.accessor("companySnapshot", {
      header: "Empresa",
    }),
    plannedAccessColHelper.accessor(getPersonsDetails, {
      id: "personsDetails",
      header: "Visitantes",
      cell: ({ row, getValue }) => (
        <div className="flex flex-col gap-1">
          <span>{row.original.plannedAccessPersons.length} visitante(s)</span>
          <span className="text-muted-foreground max-w-96 truncate text-sm">
            {getValue()}
          </span>
        </div>
      ),
    }),
    plannedAccessColHelper.accessor("visitReason", {
      header: "Motivo",
    }),
    plannedAccessColHelper.accessor(
      (plannedAccess) => plannedAccess.site?.name ?? "-",
      {
        id: "siteName",
        header: "Centro",
      },
    ),
    plannedAccessColHelper.accessor(
      (plannedAccess) => plannedAccess.requestedBy?.fullName ?? "-",
      {
        id: "requestedByName",
        header: "Solicitado por",
      },
    ),
    plannedAccessColHelper.accessor(
      (plannedAccess) =>
        plannedAccess.approvedAt ? plannedAccess.approvedBy?.fullName : "-",
      {
        id: "approvedByName",
        header: "Aprobado por",
      },
    ),
    plannedAccessColHelper.display({
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <PlannedAccessStatusActions
          plannedAccessId={row.original.id}
        status={row.original.status ?? "PENDING_APPROVAL"}
        actionPath={actionPath}
        allowedActions={allowedActions}
        />
      ),
    }),
  ];
