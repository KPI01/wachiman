import { createColumnHelper } from "@tanstack/react-table";
import MarkAccessLogExit from "~/routes/access-logs/mark-exit";
import { formatTimestamp } from "../utils";
import type { AccessLogListItem } from "../database/access-log.server";

const accessLogColHelper = createColumnHelper<AccessLogListItem>();

function getFullName(accessLog: AccessLogListItem) {
  return [
    accessLog.firstNameSnapshot,
    accessLog.middleNameSnapshot,
    accessLog.lastNameSnapshot,
    accessLog.secondLastNameSnapshot,
  ]
    .filter(Boolean)
    .join(" ");
}

function getVehicleDetails(accessLog: AccessLogListItem) {
  if (!accessLog.withVehicle || !accessLog.vehicleAccessLog) {
    return "Sin vehiculo";
  }

  return [
    accessLog.vehicleAccessLog.typeSnapshot,
    accessLog.vehicleAccessLog.brandSnapshot,
    accessLog.vehicleAccessLog.modelSnapshot,
    accessLog.vehicleAccessLog.plateSnapshot,
  ]
    .filter(Boolean)
    .join(" / ");
}

export const accessLogColumns = [
  accessLogColHelper.accessor("entryTimestamp", {
    header: "Ingreso",
    cell: ({ getValue }) =>
      formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
  }),
  accessLogColHelper.accessor("exitTimestamp", {
    header: "Salida",
    cell: ({ getValue }) => {
      const value = getValue();

      return value
        ? formatTimestamp({ date: value, template: "dd/MM/yyyy HH:mm" })
        : "-";
    },
  }),
  accessLogColHelper.accessor(getFullName, {
    id: "fullNameSnapshot",
    header: "Nombre completo",
  }),
  accessLogColHelper.accessor("legalIdSnapshot", {
    header: "Documento",
  }),
  accessLogColHelper.accessor("companyNameSnapshot", {
    header: "Empresa",
  }),
  accessLogColHelper.accessor(getVehicleDetails, {
    id: "vehicleDetails",
    header: "Vehiculo",
  }),
  accessLogColHelper.accessor("visitReason", {
    header: "Motivo",
  }),
  accessLogColHelper.accessor((accessLog) => accessLog.site.name, {
    id: "siteName",
    header: "Centro",
  }),
  accessLogColHelper.accessor((accessLog) => accessLog.createdBy.fullName, {
    id: "createdByName",
    header: "Registrado por",
  }),
  accessLogColHelper.display({
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      if (row.original.exitTimestamp) {
        return (
          <span className="text-muted-foreground sr-only">
            Salida registrada
          </span>
        );
      }

      return (
        <div className="flex justify-end">
          <MarkAccessLogExit accessLogId={row.original.id} />
        </div>
      );
    },
  }),
];
