import { createColumnHelper } from "@tanstack/react-table";
import MarkAccessLogExit from "~/components/models/access-logs/mark-access-log-exit";
import { formatTimestamp } from "../utils";
import type { AccessLogListItem } from "../database/access-log.server";
import type { AllowedArea } from "../../../db/schema";
import VehiclePopover from "~/components/models/access-logs/vehicle-popover";
import EditAccessLog from "~/components/models/access-logs/edit-access-log";
import { isStaleAccessLog } from "~/lib/access-log-status";
import { Badge } from "~/components/ui/badge";
import AccessLogColumnFilter from "~/components/models/access-logs/access-log-column-filter";
import type { DataTableColumnHeaderActions } from "~/components/ui/data-table";

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
  cell: ({ getValue, row }) => (
    <div className="flex flex-col gap-1">
      <span>{formatTimestamp({ date: getValue(), template: "dd/MM/yyyy HH:mm" })}</span>
      {isStaleAccessLog(row.original) ? (
        <Badge variant="destructive" className="w-fit text-xs">
          Sin salida +24 h
        </Badge>
      ) : null}
    </div>
  ),
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

const allowedAreaColumn = accessLogColHelper.accessor("allowedAreaSnapshot", {
  header: "Área autorizada",
});

const approvedByColumn = accessLogColHelper.accessor("approvedBySnapshot", {
  header: "Aprobado por",
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
  (accessLog) => accessLog.site?.name ?? "-",
  {
    id: "siteName",
    header: "Centro",
  },
);

const createdByNameColumn = accessLogColHelper.accessor(
  (accessLog) => accessLog.createdBy?.fullName ?? "-",
  {
    id: "createdByName",
    header: "Registrado por",
  },
);

const createdByColumn = accessLogColHelper.accessor(
  (accessLog) => accessLog.createdBy?.fullName ?? "-",
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
        <MarkAccessLogExit accessLogId={row.original.id} compact />
      </div>
    );
  },
});

function createEditableActionsColumn(allowedAreas: AllowedArea[]) {
  return accessLogColHelper.display({
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <EditAccessLog accessLog={row.original} allowedAreas={allowedAreas} />
        {!row.original.exitTimestamp ? (
          <MarkAccessLogExit accessLogId={row.original.id} compact />
        ) : null}
      </div>
    ),
  });
}

type AccessLogColumnDef =
  | typeof entryTimestampColumn
  | typeof exitTimestampColumn
  | typeof fullNameColumn
  | typeof legalIdColumn
  | typeof companyNameColumn
  | typeof allowedAreaColumn
  | typeof approvedByColumn
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

export function createAccessLogColumns(allowedAreas: AllowedArea[] = []): AccessLogColumnDef[] {
  return [
    entryTimestampColumn,
    exitTimestampColumn,
    fullNameColumn,
    legalIdColumn,
    companyNameColumn,
    allowedAreaColumn,
    approvedByColumn,
    vehicleDetailsColumn,
    visitReasonColumn,
    siteNameColumn,
    createdByNameColumn,
    createEditableActionsColumn(allowedAreas),
  ];
}

export const accessLogColumns: AccessLogColumnDef[] = createAccessLogColumns();

export const ACCESS_LOG_GLOBAL_FILTER_COLUMNS = [
  "fullNameSnapshot",
  "legalIdSnapshot",
  "companyNameSnapshot",
  "allowedAreaSnapshot",
  "approvedBySnapshot",
  "vehicleDetails",
  "siteName",
] as const;

export const ACCESS_LOG_COLUMN_FILTER_ACTIONS: DataTableColumnHeaderActions<AccessLogListItem> = {
  fullNameSnapshot: (column) => (
    <AccessLogColumnFilter column={column} label="Nombre completo" />
  ),
  legalIdSnapshot: (column) => (
    <AccessLogColumnFilter column={column} label="Documento" />
  ),
  companyNameSnapshot: (column) => (
    <AccessLogColumnFilter column={column} label="Empresa" />
  ),
  allowedAreaSnapshot: (column) => (
    <AccessLogColumnFilter column={column} label="Área autorizada" />
  ),
  approvedBySnapshot: (column) => (
    <AccessLogColumnFilter column={column} label="Aprobado por" />
  ),
  vehicleDetails: (column) => (
    <AccessLogColumnFilter column={column} label="Vehículo" />
  ),
  siteName: (column) => (
    <AccessLogColumnFilter column={column} label="Centro" />
  ),
};

const baseColumns: AccessLogColumnDef[] = [
  entryTimestampColumn,
  exitTimestampColumn,
  fullNameColumn,
  legalIdColumn,
  companyNameColumn,
  allowedAreaColumn,
  approvedByColumn,
];

const optionalColumns: Record<OptionalColumnsOptions, AccessLogColumnDef> = {
  visitReason: visitReasonColumn,
  vehicleDetails: vehicleDetailsColumn,
  createdBy: createdByColumn,
  actions: actionsColumn,
};

export function getAccessLogColumns(
  columns: OptionalColumnsOptions | readonly OptionalColumnsOptions[] = [],
  allowedAreas: AllowedArea[] = [],
): AccessLogColumnDef[] {
  const selectedColumns: readonly OptionalColumnsOptions[] = Array.isArray(
    columns,
  )
    ? columns
    : [columns];

  return [
    ...baseColumns,
    ...selectedColumns.map((column) =>
      column === "actions" ? createEditableActionsColumn(allowedAreas) : optionalColumns[column],
    ),
  ];
}
