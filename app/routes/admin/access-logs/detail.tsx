import { redirect } from "react-router";
import type { Route } from "./+types/detail";
import MarkAccessLogExit from "~/routes/access-log/mark-exit";
import {
  getAccessLogById,
  markAccessLogExit,
} from "~/lib/database/access-log";
import { formatTimestamp } from "~/lib/utils";

function getFullName(accessLog: NonNullable<Awaited<ReturnType<typeof getAccessLogById>>>) {
  return [
    accessLog.firstNameSnapshot,
    accessLog.middleNameSnapshot,
    accessLog.lastNameSnapshot,
    accessLog.secondLastNameSnapshot,
  ]
    .filter(Boolean)
    .join(" ");
}

function getVehicleDetails(
  accessLog: NonNullable<Awaited<ReturnType<typeof getAccessLogById>>>,
) {
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

function getReturnPath(request: Request, accessLogId: string) {
  const referer = request.headers.get("Referer");

  if (!referer) {
    return `/admin/access-logs/${accessLogId}`;
  }

  const { pathname, search } = new URL(referer);

  return `${pathname}${search}`;
}

export async function loader({ params }: Route.LoaderArgs) {
  const accessLog = await getAccessLogById(params.id);

  if (!accessLog) {
    throw new Response("Not Found", { status: 404 });
  }

  return { accessLog };
}

export async function action({ params, request }: Route.ActionArgs) {
  await markAccessLogExit(params.id);

  return redirect(getReturnPath(request, params.id));
}

export default function AdminAccessLogDetail({
  loaderData,
}: Route.ComponentProps) {
  const { accessLog } = loaderData;

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Registro de acceso</h1>
          <p className="text-muted-foreground">{getFullName(accessLog)}</p>
        </div>
        {!accessLog.exitTimestamp ? (
          <MarkAccessLogExit accessLogId={accessLog.id} />
        ) : (
          <span className="text-sm text-muted-foreground">Salida registrada</span>
        )}
      </div>

      <div className="grid gap-4 rounded-lg border p-6 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Ingreso</p>
          <p>
            {formatTimestamp({
              date: accessLog.entryTimestamp,
              template: "dd/MM/yyyy HH:mm",
            })}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Salida</p>
          <p>
            {accessLog.exitTimestamp
              ? formatTimestamp({
                  date: accessLog.exitTimestamp,
                  template: "dd/MM/yyyy HH:mm",
                })
              : "Pendiente"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Documento</p>
          <p>{accessLog.legalIdSnapshot}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Empresa</p>
          <p>{accessLog.companyNameSnapshot}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Telefono</p>
          <p>{accessLog.phoneNumber || "-"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Centro</p>
          <p>{accessLog.site.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Motivo</p>
          <p>{accessLog.visitReason}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Registrado por</p>
          <p>{accessLog.createdBy.fullName}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm text-muted-foreground">Vehiculo</p>
          <p>{getVehicleDetails(accessLog)}</p>
        </div>
      </div>
    </div>
  );
}
