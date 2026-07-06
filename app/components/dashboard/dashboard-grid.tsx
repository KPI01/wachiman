import { useMemo, useState } from "react";
import {
  Responsive,
  WidthProvider,
  type Layout,
  type LayoutItem,
} from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";

import { Button } from "~/components/ui/button";
import { Pencil, RotateCcw, Check } from "lucide-react";
import { cn } from "~/lib/utils";

import { useDashboardLayout } from "./use-dashboard-layout";
import { WIDGET_REGISTRY } from "./widget-registry";
import type {
  DashboardGridProps,
  WidgetConstraints,
  WidgetLayout,
} from "./types";

const ResponsiveGridLayout = WidthProvider(Responsive);

const GRID_CLASS_PREFIX = "wachiman";

const BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
};

const COLS = {
  lg: 6,
  md: 6,
  sm: 4,
  xs: 2,
  xxs: 1,
};
const ROW_HEIGHT = 48;

export function DashboardGrid({
  storageKey,
  widgetIds,
  scope,
}: DashboardGridProps) {
  const [editMode, setEditMode] = useState(false);

  const defaults = useMemo<WidgetLayout[]>(
    () => widgetIds.map((id) => WIDGET_REGISTRY[id].defaultLayout),
    [widgetIds],
  );

  const constraintsByWidget = useMemo(() => {
    const map: Record<string, WidgetConstraints> = {};
    for (const id of widgetIds) {
      map[id] = WIDGET_REGISTRY[id].constraints;
    }
    return map;
  }, [widgetIds]);

  const { layout, reset, persist } = useDashboardLayout(
    storageKey,
    defaults,
    constraintsByWidget,
  );

  const handleLayoutChange = (next: Layout) => {
    const sanitized: WidgetLayout[] = next.map((item: LayoutItem) => ({
      i: item.i as WidgetLayout["i"],
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    }));
    persist(sanitized);
  };

  const layoutWithConstraints = useMemo<Layout>(() => {
    return layout.map((item) => {
      const constraints = constraintsByWidget[item.i];
      if (!constraints) return item;
      return {
        ...item,
        minW: constraints.minW,
        maxW: constraints.maxW,
        minH: constraints.minH,
        maxH: constraints.maxH,
      };
    });
  }, [layout, constraintsByWidget]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            reset();
            setEditMode(false);
          }}
        >
          <RotateCcw className="size-4" />
          Restaurar layout
        </Button>
        <Button
          type="button"
          variant={editMode ? "default" : "outline"}
          size="sm"
          onClick={() => setEditMode((prev) => !prev)}
        >
          {editMode ? (
            <>
              <Check className="size-4" />
              Guardar
            </>
          ) : (
            <>
              <Pencil className="size-4" />
              Editar dashboard
            </>
          )}
        </Button>
      </div>

      <div className={cn(editMode && "dashboard-grid-editing")}>
        <ResponsiveGridLayout
          className={`${GRID_CLASS_PREFIX}-layout`}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          layouts={{ lg: layoutWithConstraints }}
          rowHeight={ROW_HEIGHT}
          margin={[16, 16]}
          isDraggable={editMode}
          isResizable={editMode}
          draggableHandle=".widget-drag-handle"
          compactType="vertical"
          onLayoutChange={handleLayoutChange}
        >
          {widgetIds.map((id) => {
            const def = WIDGET_REGISTRY[id];
            const WidgetComponent = def.component;
            return (
              <div key={id}>
                <WidgetComponent scope={scope} editMode={editMode} />
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}
