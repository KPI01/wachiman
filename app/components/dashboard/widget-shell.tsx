import type { ReactNode } from "react";
import { GripVertical, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button, buttonVariants } from "~/components/ui/button";
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
    <Card className={cn("h-full border-0.5 p-0 gap-0 shadow-sm", className)}>
      <CardHeader className="flex items-center justify-between border-b py-1!">
        <CardTitle
          className={cn(
            "widget-drag-handle select-none text-sm font-medium",
            editMode &&
              cn(
                buttonVariants({ variant: "ghost" }),
                "cursor-grab active:cursor-grabbing",
              ),
          )}
        >
          {editMode && <GripVertical />}
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">
          {!editMode && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Actualizar widget"
            >
              <RefreshCw
                className={cn("size-4", isLoading && "animate-spin")}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn("flex-1 overflow-hidden py-0", bodyClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
