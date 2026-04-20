import { createColumnHelper } from "@tanstack/react-table";
import MarkAccessLogExit from "~/routes/access-logs/mark-exit";
import { formatTimestamp } from "../utils";
import type { AccessLogListItem } from "../database/access-log";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button, buttonVariants } from "~/components/ui/button";
import { InfoIcon } from "lucide-react";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";

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
  accessLogColHelper.display({
    id: "vehicleAccessLog",
    header: "Vehiculo",
    cell: ({ row }) => {
      if (!row.original.vehicleAccessLogId) return "-";
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary">
              <InfoIcon />
              {row.original.vehicleAccessLog?.plateSnapshot}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top">
            <PopoverTitle>Datos del vehículo</PopoverTitle>
            <ul className="[&>li>span]:font-bold">
              <li id="vehicleTypeSnapshot">
                <span>Tipo:</span>{" "}
                {row.original.vehicleAccessLog?.typeSnapshot ?? "-"}
              </li>
              <li id="vehicleBrandSnapshot">
                <span>Marca:</span>{" "}
                {row.original.vehicleAccessLog?.brandSnapshot ?? "-"}
              </li>
              <li id="vehicleModelSnapshot">
                <span>Marca:</span>{" "}
                {row.original.vehicleAccessLog?.modelSnapshot ?? "-"}
              </li>
            </ul>
          </PopoverContent>
        </Popover>
      );
    },
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
    cell: ({ row }) => (
      <div className="flex justify-end">
        {row.original.exitTimestamp ? (
          <span className="text-muted-foreground sr-only">
            Salida registrada
          </span>
        ) : (
          <MarkAccessLogExit accessLogId={row.original.id} />
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm">
              <InfoIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="left">
            <PopoverTitle>Razón de la visita</PopoverTitle>
            <span>{row.original.visitReason}</span>
          </PopoverContent>
        </Popover>
      </div>
    ),
  }),
];
