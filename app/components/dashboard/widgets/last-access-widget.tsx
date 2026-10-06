import { MapPin } from "lucide-react";

import { WidgetShell } from "../widget-shell";
import { useWidgetData } from "../use-widget-data";
import { WIDGET_REGISTRY } from "../widget-registry";
import { Skeleton } from "~/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyTitle } from "~/components/ui/empty";
import { formatTimestamp } from "~/lib/utils";
import type { WidgetComponentProps } from "../types";

type LastAccessData = {
  sites: Array<{
    siteId: string;
    siteName: string;
    accessLog: {
      id: string;
      entryTimestamp: string;
      personFullName: string;
    } | null;
  }>;
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
      bodyClassName="dashboard-widget-scroll"
    >
      {data === undefined ? (
        <div className="space-y-2 py-2 pr-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : data.sites.length === 0 ? (
        <Empty className="py-6">
          <EmptyTitle>Sin plantas disponibles</EmptyTitle>
          <EmptyDescription>
            No hay plantas disponibles para mostrar.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="space-y-2 py-2 pr-1">
          {data.sites.map((site) => (
            <div
              key={site.siteId}
              className="min-w-0 rounded-md border px-3 py-2"
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{site.siteName}</span>
                </span>
                {site.accessLog ? (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatTimestamp({
                      date: new Date(site.accessLog.entryTimestamp),
                      template: "dd/MM HH:mm",
                    })}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate pl-5 text-xs text-muted-foreground">
                {site.accessLog?.personFullName ?? "Sin accesos registrados"}
              </p>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
