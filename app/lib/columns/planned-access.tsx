import { createColumnHelper } from "@tanstack/react-table";
import type { ComponentProps } from "react";
import type { PlannedAccessStatus } from "../../../db/enums";
import { Badge } from "~/components/ui/badge";
import type { PlannedAccessListItem } from "../database/planned-access.server";
import { formatTimestamp } from "../utils";
import { formatAccessDuration } from "../access-duration";
import { InfoIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";

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

function StatusReasonPopover({
  statusLabel,
  reason,
}: {
  statusLabel: string;
  reason: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<number | null>(null);

  const openPopover = () => {
    if (closeTimeout.current !== null) {
      window.clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimeout.current !== null) window.clearTimeout(closeTimeout.current);
    closeTimeout.current = window.setTimeout(() => {
      setOpen(false);
      closeTimeout.current = null;
    }, 140);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          aria-label={`Ver motivo de ${statusLabel.toLowerCase()}`}
          onPointerEnter={openPopover}
          onPointerLeave={scheduleClose}
          onFocus={openPopover}
        >
          <InfoIcon aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-80 max-w-[calc(100vw-2rem)] whitespace-normal"
        onPointerEnter={openPopover}
        onPointerLeave={scheduleClose}
      >
        <PopoverHeader>
          <PopoverTitle>{statusLabel}</PopoverTitle>
        </PopoverHeader>
        <p className="wrap-break-word text-sm text-muted-foreground">{reason}</p>
      </PopoverContent>
    </Popover>
  );
}

function VisitorsDetailsPopover({
  persons,
}: {
  persons: PlannedAccessListItem["plannedAccessPersons"];
}) {
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<number | null>(null);

  const openPopover = () => {
    if (closeTimeout.current !== null) {
      window.clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimeout.current !== null) window.clearTimeout(closeTimeout.current);
    closeTimeout.current = window.setTimeout(() => {
      setOpen(false);
      closeTimeout.current = null;
    }, 140);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          aria-label="Ver visitantes de la solicitud"
          onClick={(event) => event.stopPropagation()}
          onPointerEnter={openPopover}
          onPointerLeave={scheduleClose}
          onFocus={openPopover}
        >
          <InfoIcon aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-96 max-w-[calc(100vw-2rem)] whitespace-normal p-3"
        onPointerEnter={openPopover}
        onPointerLeave={scheduleClose}
      >
        <PopoverHeader>
          <PopoverTitle>Personas incluidas en la solicitud</PopoverTitle>
        </PopoverHeader>
        <div className="mt-2 max-h-[min(60vh,24rem)] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="pb-2 pr-3 font-medium">DNI</th>
                <th scope="col" className="pb-2 pr-3 font-medium">Nombre</th>
                <th scope="col" className="pb-2 text-right font-medium">Tiempo dentro</th>
              </tr>
            </thead>
            <tbody>
              {persons.map((person) => (
                <tr key={person.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 align-top whitespace-nowrap">
                    {person.legalIdSnapshot}
                  </td>
                  <td className="py-2 pr-3 align-top">
                    {getFullName(person)}
                  </td>
                  <td className="py-2 text-right align-top whitespace-nowrap">
                    {formatAccessDuration(person.presenceDurationMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
    .map(
      (person) =>
        `${getFullName(person)} (${person.legalIdSnapshot}) · ${person.workCategory?.name ?? "Sin tipo de trabajo"} · ${person.allowedArea?.name ?? person.allowedAreaSnapshot ?? "Sin área"}`,
    )
    .join(", ");
}

export const plannedAccessColumns = (
  {
    includeApprovedBy = true,
    includeSite = true,
  }: { includeApprovedBy?: boolean; includeSite?: boolean } = {},
) => [
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
      cell: ({ getValue, row }) => {
        const status = getValue() ?? "PENDING_APPROVAL";
        const reason = row.original.decisionReason;
        const showReason =
          (status === "REJECTED" || status === "CANCELED") && Boolean(reason);

        return (
          <div className="flex max-w-56 flex-col items-start gap-1">
            <div className="flex items-center gap-1">
              <Badge variant={PLANNED_ACCESS_STATUS_VARIANTS[status]}>
                {PLANNED_ACCESS_STATUS_LABELS[status]}
              </Badge>
              {showReason ? (
                <StatusReasonPopover
                  statusLabel={PLANNED_ACCESS_STATUS_LABELS[status]}
                  reason={reason ?? ""}
                />
              ) : null}
            </div>
          </div>
        );
      },
    }),
    plannedAccessColHelper.accessor("companySnapshot", {
      header: "Empresa",
    }),
    plannedAccessColHelper.accessor(getPersonsDetails, {
      id: "personsDetails",
      header: "Visitantes",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span>
            {row.original.plannedAccessPersons.length}{" "}
            {row.original.plannedAccessPersons.length === 1
              ? "visitante"
              : "visitantes"}
          </span>
          <VisitorsDetailsPopover persons={row.original.plannedAccessPersons} />
        </div>
      ),
    }),
    plannedAccessColHelper.accessor("visitReason", {
      header: "Motivo",
    }),
    ...(includeSite
      ? [
          plannedAccessColHelper.accessor(
            (plannedAccess) => plannedAccess.site?.name ?? "-",
            {
              id: "siteName",
              header: "Centro",
            },
          ),
        ]
      : []),
    plannedAccessColHelper.accessor(
      (plannedAccess) => plannedAccess.requestedBy?.fullName ?? "-",
      {
        id: "requestedByName",
        header: "Solicitado por",
      },
    ),
    ...(includeApprovedBy
      ? [
          plannedAccessColHelper.accessor(
            (plannedAccess) =>
              plannedAccess.approvedAt ? plannedAccess.approvedBy?.fullName : "-",
            {
              id: "approvedByName",
              header: "Aprobado por",
            },
          ),
        ]
      : []),
  ];
