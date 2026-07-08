import { useMemo } from "react";
import { ChevronDown, Users, MapPin } from "lucide-react";

import { WidgetShell } from "../widget-shell";
import { useWidgetData } from "../use-widget-data";
import { WIDGET_REGISTRY } from "../widget-registry";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { formatTimestamp } from "~/lib/utils";
import type { AccessLogListItem } from "~/lib/database/access-log.server";
import type { WidgetComponentProps } from "../types";

type PeopleInsideData = {
  accessLogs: AccessLogListItem[];
};

type SiteGroup = {
  siteId: string;
  siteName: string;
  people: AccessLogListItem[];
};

function groupBySite(accessLogs: AccessLogListItem[]): SiteGroup[] {
  const map = new Map<string, SiteGroup>();
  for (const log of accessLogs) {
    const existing = map.get(log.site.id);
    if (existing) {
      existing.people.push(log);
    } else {
      map.set(log.site.id, {
        siteId: log.site.id,
        siteName: log.site.name,
        people: [log],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.siteName.localeCompare(b.siteName),
  );
}

function buildFullName(log: AccessLogListItem): string {
  return [
    log.firstNameSnapshot,
    log.middleNameSnapshot,
    log.lastNameSnapshot,
    log.secondLastNameSnapshot,
  ]
    .filter(Boolean)
    .join(" ");
}

export function RequesterPeopleInsideWidget({
  scope,
  editMode,
}: WidgetComponentProps) {
  const def = WIDGET_REGISTRY["requester-people-inside"];
  const { data, isLoading, revalidate } = useWidgetData<PeopleInsideData>(
    "/api/dashboard/requester-people-inside",
    scope,
    def.refreshMs,
  );

  const groups = useMemo(
    () => (data ? groupBySite(data.accessLogs) : []),
    [data],
  );

  const totalInside = data?.accessLogs.length ?? 0;

  return (
    <WidgetShell
      title={def.title}
      editMode={editMode}
      isLoading={isLoading}
      onRefresh={revalidate}
      bodyClassName="overflow-y-auto"
    >
      {data === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : totalInside === 0 ? (
        <Empty className="py-8">
          <EmptyMedia variant="icon">
            <Users className="size-5" />
          </EmptyMedia>
          <EmptyTitle>Nadie dentro</EmptyTitle>
          <EmptyDescription>
            No hay personas dentro de las instalaciones vinculadas a solicitudes
            de tu departamento.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {totalInside}{" "}
            {totalInside === 1 ? "persona dentro" : "personas dentro"}
          </p>
          {groups.map((group) => (
            <Collapsible key={group.siteId} defaultOpen>
              <div className="rounded-lg border border-border/60">
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/50">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="size-4 text-muted-foreground" />
                    {group.siteName}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary">{group.people.length}</Badge>
                    <ChevronDown className="size-4 text-muted-foreground transition-transform [[data-state=closed]_&]:rotate-180" />
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="divide-y divide-border/60 border-t border-border/60">
                    {group.people.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {buildFullName(log)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {log.legalIdSnapshot}
                            {log.companyNameSnapshot
                              ? ` · ${log.companyNameSnapshot}`
                              : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {formatTimestamp({
                            date: log.entryTimestamp,
                            template: "HH:mm",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
