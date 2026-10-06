import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import type { AccessLogListItem } from "~/lib/database/access-log.server";
import { getOpenDurationLabel, isStaleAccessLog } from "~/lib/access-log-status";
import { formatTimestamp } from "~/lib/utils";
import MarkAccessLogExit from "~/components/models/access-logs/mark-access-log-exit";

function getFullName(accessLog: AccessLogListItem) {
  return [
    accessLog.firstNameSnapshot,
    accessLog.middleNameSnapshot,
    accessLog.lastNameSnapshot,
    accessLog.secondLastNameSnapshot,
  ].filter(Boolean).join(" ");
}

export default function StaleAccessWarning({
  accessLogs,
  allowExit = false,
}: {
  accessLogs: AccessLogListItem[];
  allowExit?: boolean;
}) {
  const staleLogs = accessLogs.filter((accessLog) => isStaleAccessLog(accessLog));

  if (staleLogs.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangleIcon />
      <AlertTitle>
        {staleLogs.length === 1
          ? "Hay un acceso abierto desde hace más de 24 horas"
          : `Hay ${staleLogs.length} accesos abiertos desde hace más de 24 horas`}
      </AlertTitle>
      <AlertDescription>
        <div className="flex flex-col gap-2">
          <span>Verifica estas personas y registra su salida cuando corresponda.</span>
          <div className="flex flex-col gap-2">
            {staleLogs.map((accessLog) => (
              <div key={accessLog.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/30 p-2">
                <span className="font-medium">
                  {getFullName(accessLog)} · {accessLog.site?.name ?? "Centro"}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="destructive">{getOpenDurationLabel(accessLog)}</Badge>
                  Ingreso: {formatTimestamp({ date: accessLog.entryTimestamp, template: "dd/MM/yyyy HH:mm" })}
                  {allowExit ? <MarkAccessLogExit accessLogId={accessLog.id} mode="operator" /> : null}
                </span>
              </div>
            ))}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
