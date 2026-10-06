import { WidgetShell } from "../widget-shell";
import { useWidgetData } from "../use-widget-data";
import { WIDGET_REGISTRY } from "../widget-registry";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import type { WidgetComponentProps } from "../types";

type TodayAccessCountData = {
  count: number;
  sites: Array<{ siteId: string; siteName: string; count: number }>;
};

export function TodayAccessCountWidget({ scope, editMode }: WidgetComponentProps) {
  const def = WIDGET_REGISTRY["today-access-count"];
  const { data, isLoading, revalidate } = useWidgetData<TodayAccessCountData>(
    "/api/dashboard/today-access-count",
    scope,
    def.refreshMs,
  );

  return (
    <WidgetShell
      title={def.title}
      editMode={editMode}
      isLoading={isLoading}
      onRefresh={revalidate}
      bodyClassName="dashboard-widget-scroll flex flex-col"
    >
      {data === undefined ? (
        <div className="space-y-2 py-2 pr-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex w-full flex-col gap-2 py-2 pr-1">
          {data.sites.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center gap-0.5">
              <span className="font-heading text-4xl font-bold leading-none tabular-nums text-foreground">
                0
              </span>
              <span className="text-xs text-muted-foreground">Entradas hoy</span>
            </div>
          ) : (
            data.sites.map((site) => (
              <div key={site.siteId} className="flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 py-2">
                <span className="min-w-0 truncate text-sm text-muted-foreground">
                  {site.siteName}
                </span>
                <span className={cn("font-heading text-3xl font-bold leading-none tabular-nums text-foreground")}>
                  {site.count}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </WidgetShell>
  );
}
