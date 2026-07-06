import { WidgetShell } from "../widget-shell";
import { useWidgetData } from "../use-widget-data";
import { WIDGET_REGISTRY } from "../widget-registry";
import { Skeleton } from "~/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyTitle } from "~/components/ui/empty";
import { formatTimestamp } from "~/lib/utils";
import type { WidgetComponentProps } from "../types";

type LastAccessData = {
  accessLog: {
    id: string;
    entryTimestamp: string;
    siteName: string;
    personFullName: string;
  } | null;
};

export function LastAccessWidget({ scope, editMode }: WidgetComponentProps) {
  const def = WIDGET_REGISTRY["last-access"];
  const { data, isLoading, revalidate } = useWidgetData<LastAccessData>(
    "/api/dashboard/last-access",
    scope,
    def.refreshMs,
  );

  return (
    <WidgetShell
      title={def.title}
      editMode={editMode}
      isLoading={isLoading}
      onRefresh={revalidate}
      bodyClassName="flex flex-col justify-evenly items-center h-full"
    >
      {data === undefined ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : data.accessLog === null ? (
        <Empty className="py-6">
          <EmptyTitle>Sin accesos</EmptyTitle>
          <EmptyDescription>Aún no hay accesos registrados.</EmptyDescription>
        </Empty>
      ) : (
        <>
          <div className="text-lg font-bold">
            {formatTimestamp({
              date: new Date(data.accessLog.entryTimestamp),
              template: "dd/MM/yyyy",
            })}
          </div>
          <div className="text-2xl font-bold text-muted-foreground">
            {formatTimestamp({
              date: new Date(data.accessLog.entryTimestamp),
              template: "HH:mm",
            })}
          </div>
          <span className="truncate font-medium text-foreground">
            {data.accessLog.personFullName}
          </span>
          <span className="truncate text-muted-foreground">
            {data.accessLog.siteName}
          </span>
        </>
      )}
    </WidgetShell>
  );
}
