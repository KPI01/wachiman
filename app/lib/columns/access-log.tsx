import { createColumnHelper } from "@tanstack/react-table";
import MarkAccessLogExit from "~/components/models/access-logs/mark-access-log-exit";
import { formatTimestamp } from "../utils";
import type { AccessLogListItem } from "../database/access-log.server";
import VehiclePopover from "~/components/models/access-logs/vehicle-popover";

const accessLogColHelper = createColumnHelper<AccessLogListItem>();

function getFullName(accessLog: AccessLogListItem): string {
  return [
    accessLog.firstNameSnapshot,
    accessLog.middleNameSnapshot,
    accessLog.lastNameSnapshot,
    accessLog.secondLastNameSnapshot,
  ]
    .filter(Boolean)
    .join(" ");
}

function getVehicleDetails(accessLog: AccessLogListItem): string {
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

const entryTimestampColumn = accessLogColHelper.accessor("entryTimestamp", {
  header: "Ingreso",
  cell: ({ getValue }) =>
    formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" }),
});

const exitTimestampColumn = accessLogColHelper.accessor("exitTimestamp", {
  header: "Salida",
  cell: ({ getValue }) => {
    const value = getValue();

    return value
      ? formatTimestamp({ date: value, template: "dd/MM/yyyy HH:mm" })
      : "-";
  },
});

const fullNameColumn = accessLogColHelper.accessor(getFullName, {
  id: "fullNameSnapshot",
  header: "Nombre completo",
});

const legalIdColumn = accessLogColHelper.accessor("legalIdSnapshot", {
  header: "Documento",
});

const companyNameColumn = accessLogColHelper.accessor("companyNameSnapshot", {
  header: "Empresa",
});

const vehicleDetailsColumn = accessLogColHelper.accessor(getVehicleDetails, {
  id: "vehicleDetails",
  header: "Vehiculo",
  cell: ({ row }) =>
    row.original.withVehicle && row.original.vehicleAccessLog ? (
      <VehiclePopover vehicleLog={row.original.vehicleAccessLog} />
    ) : undefined,
});

const visitReasonColumn = accessLogColHelper.accessor("visitReason", {
  id: "visitReason",
  header: "Motivo",
});

const siteNameColumn = accessLogColHelper.accessor(
  (accessLog) => accessLog.site.name,
  {
    id: "siteName",
    header: "Centro",
  },
);

const createdByNameColumn = accessLogColHelper.accessor(
  (accessLog) => accessLog.createdBy.fullName,
  {
    id: "createdByName",
    header: "Registrado por",
  },
);

const createdByColumn = accessLogColHelper.accessor(
  (accessLog) => accessLog.createdBy.fullName,
  {
    id: "createdBy",
    header: "Registrado por",
  },
);

const actionsColumn = accessLogColHelper.display({
  id: "actions",
  header: "Acciones",
  cell: ({ row }) => {
    if (row.original.exitTimestamp) {
      return (
        <span className="text-muted-foreground sr-only">Salida registrada</span>
      );
    }

    return (
      <div className="flex justify-end">
        <MarkAccessLogExit accessLogId={row.original.id} />
      </div>
    );
  },
});

type AccessLogColumnDef =
  | typeof entryTimestampColumn
  | typeof exitTimestampColumn
  | typeof fullNameColumn
  | typeof legalIdColumn
  | typeof companyNameColumn
  | typeof vehicleDetailsColumn
  | typeof visitReasonColumn
  | typeof siteNameColumn
  | typeof createdByNameColumn
  | typeof createdByColumn
  | typeof actionsColumn;

export type OptionalColumnsOptions =
  | "visitReason"
  | "vehicleDetails"
  | "createdBy"
  | "actions";

export const accessLogColumns: AccessLogColumnDef[] = [
  entryTimestampColumn,
  exitTimestampColumn,
  fullNameColumn,
  legalIdColumn,
  companyNameColumn,
  vehicleDetailsColumn,
  visitReasonColumn,
  siteNameColumn,
  createdByNameColumn,
  actionsColumn,
];

const baseColumns: AccessLogColumnDef[] = [
  entryTimestampColumn,
  exitTimestampColumn,
  fullNameColumn,
  legalIdColumn,
  companyNameColumn,
];

const optionalColumns: Record<OptionalColumnsOptions, AccessLogColumnDef> = {
  visitReason: visitReasonColumn,
  vehicleDetails: vehicleDetailsColumn,
  createdBy: createdByColumn,
  actions: actionsColumn,
};

export function getAccessLogColumns(
  columns: OptionalColumnsOptions | readonly OptionalColumnsOptions[] = [],
): AccessLogColumnDef[] {
  const selectedColumns: readonly OptionalColumnsOptions[] = Array.isArray(
    columns,
  )
    ? columns
    : [columns];

  return [
    ...baseColumns,
    ...selectedColumns.map((column) => optionalColumns[column]),
  ];
}
