import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type WidgetShellProps = {
  title: string;
  editMode: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function WidgetShell({
  title,
  editMode,
  isLoading,
  onRefresh,
  children,
  className,
  bodyClassName,
}: WidgetShellProps) {
  return (
    <Card className={cn("h-full border-2 border-border p-0 gap-0", className)}>
      <CardHeader className="flex items-center justify-between gap-2 border-b-2 border-border py-2">
        <CardTitle
          className={cn(
            "widget-drag-handle select-none text-sm font-medium",
            editMode && "cursor-grab active:cursor-grabbing",
          )}
        >
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">
          {editMode && (
            <span className="text-xs text-muted-foreground">Arrastrar</span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Actualizar widget"
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent
        className={cn("flex-1 overflow-hidden py-0", bodyClassName)}
      >
        {children}
      </CardContent>
    </Card>
  );
}
