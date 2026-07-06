import { WidgetShell } from "../widget-shell";
import { useWidgetData } from "../use-widget-data";
import { WIDGET_REGISTRY } from "../widget-registry";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import type { WidgetComponentProps } from "../types";

type PlannedAccessStatusData = {
  pendingApproval: number;
  approved: number;
  partiallyUsed: number;
};

type StatusBlock = {
  key: keyof PlannedAccessStatusData;
  label: string;
  tone: string;
};

const BLOCKS: StatusBlock[] = [
  {
    key: "pendingApproval",
    label: "Pendientes",
    tone: "text-amber-600 dark:text-amber-500",
  },
  {
    key: "approved",
    label: "Aprobadas",
    tone: "text-emerald-600 dark:text-emerald-500",
  },
  {
    key: "partiallyUsed",
    label: "Parcialmente usadas",
    tone: "text-sky-600 dark:text-sky-500",
  },
];

export function PlannedAccessStatusWidget({
  scope,
  editMode,
}: WidgetComponentProps) {
  const def = WIDGET_REGISTRY["planned-access-status"];
  const { data, isLoading, revalidate } =
    useWidgetData<PlannedAccessStatusData>(
      "/api/dashboard/planned-access-status",
      scope,
      def.refreshMs,
    );

  return (
    <WidgetShell
      title={def.title}
      editMode={editMode}
      isLoading={isLoading}
      onRefresh={revalidate}
      bodyClassName="flex items-stretch justify-center overflow-hidden"
    >
      {data === undefined ? (
        <div className="flex w-full flex-row items-stretch gap-2">
          {BLOCKS.map((block) => (
            <Skeleton key={block.key} className="h-20 flex-1" />
          ))}
        </div>
      ) : (
        <div className="flex h-full w-full flex-row items-stretch gap-2">
          {BLOCKS.map((block) => (
            <div
              key={block.key}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-center"
            >
              <span
                className={cn(
                  "font-heading text-3xl font-bold leading-none tabular-nums",
                  block.tone,
                )}
              >
                {data[block.key]}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground sm:text-xs">
                {block.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
