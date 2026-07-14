import { validateUserRole } from "~/lib/auth.server";
import { getExternalWorkerById } from "~/lib/services/external-worker.server";
import type { Route } from "./+types/external-worker.$id";
import { formatTimestamp } from "~/lib/utils";
import { Separator } from "~/components/ui/separator";
import { data } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import type { PlannedAccessStatus } from "../../../prisma/generated/prisma/client";

const PLANNED_ACCESS_STATUS_LABELS: Record<PlannedAccessStatus, string> = {
  PENDING_APPROVAL: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  CANCELED: "Cancelada",
  EXPIRED: "Expirada",
  USED: "Usada",
  PARTIALLY_USED: "Parcialmente usada",
};

export async function loader({ request, params }: Route.LoaderArgs) {
  await validateUserRole(request, [
    "ADMIN",
    "SECURITY_MANAGER",
    "ACCESS_APPROVER",
  ]);

  const worker = await getExternalWorkerById(params.id);

  if (!worker) {
    throw data("Trabajador no encontrado", { status: 404 });
  }

  return { worker };
}

export default function ExternalWorkerDetail({
  loaderData,
}: Route.ComponentProps) {
  const { worker } = loaderData;

  return (
    <div className="flex flex-col gap-y-6">
      <div>
        <h2 className="text-3xl font-bold">
          {worker.firstName} {worker.middleName ? `${worker.middleName} ` : ""}
          {worker.lastName}{" "}
          {worker.secondLastName ? worker.secondLastName : ""}
        </h2>
        <p className="text-muted-foreground">DNI: {worker.legalId}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-lg font-semibold">
            Informacion del Trabajador
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Empresa</dt>
              <dd className="font-medium">{worker.company.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Categoria</dt>
              <dd className="font-medium">{worker.workCategory.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Telefono</dt>
              <dd className="font-medium">{worker.phoneNumber || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Creado</dt>
              <dd className="font-medium">
                {formatTimestamp({
                  date: worker.createdAt,
                  template: "dd/MM/yyyy HH:mm",
                })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Actualizado</dt>
              <dd className="font-medium">
                {formatTimestamp({
                  date: worker.updatedAt,
                  template: "dd/MM/yyyy HH:mm",
                })}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-lg font-semibold">Empresa</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nombre</dt>
              <dd className="font-medium">{worker.company.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">CIF</dt>
              <dd className="font-medium">{worker.company.cif || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Direccion</dt>
              <dd className="font-medium">{worker.company.address || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Telefono</dt>
              <dd className="font-medium">{worker.company.phone || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{worker.company.email || "-"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-3 text-xl font-semibold">
          Historial de Accesos (ultimos 50)
        </h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha Ingreso</TableHead>
                <TableHead>Fecha Salida</TableHead>
                <TableHead>Centro</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Registrado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {worker.accessLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sin registros de acceso
                  </TableCell>
                </TableRow>
              ) : (
                worker.accessLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {formatTimestamp({
                        date: log.entryTimestamp,
                        template: "dd/MM/yyyy HH:mm",
                      })}
                    </TableCell>
                    <TableCell>
                      {log.exitTimestamp
                        ? formatTimestamp({
                            date: log.exitTimestamp,
                            template: "dd/MM/yyyy HH:mm",
                          })
                        : "Dentro"}
                    </TableCell>
                    <TableCell>{log.site.name}</TableCell>
                    <TableCell>{log.companyNameSnapshot}</TableCell>
                    <TableCell>{log.createdBy.fullName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-3 text-xl font-semibold">
          Solicitudes Planificadas (ultimas 50)
        </h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Centro</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Solicitante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {worker.plannedAccessPersons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Sin solicitudes planificadas
                  </TableCell>
                </TableRow>
              ) : (
                worker.plannedAccessPersons.map((pap) => (
                  <TableRow key={pap.id}>
                    <TableCell>{pap.plannedAccess.site.name}</TableCell>
                    <TableCell>{pap.plannedAccess.companySnapshot}</TableCell>
                    <TableCell>
                      <Badge>{PLANNED_ACCESS_STATUS_LABELS[pap.plannedAccess.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatTimestamp({
                        date: pap.plannedAccess.expectedStartDatetime,
                        template: "dd/MM/yyyy HH:mm",
                      })}
                    </TableCell>
                    <TableCell>
                      {pap.plannedAccess.expectedEndDatetime
                        ? formatTimestamp({
                            date: pap.plannedAccess.expectedEndDatetime,
                            template: "dd/MM/yyyy HH:mm",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>{pap.plannedAccess.requestedBy.fullName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
