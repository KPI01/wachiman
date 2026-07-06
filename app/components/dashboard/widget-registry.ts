import type { WidgetDefinition, WidgetId } from "./types";
import { PeopleInsideWidget } from "./widgets/people-inside-widget";
import { TodayAccessCountWidget } from "./widgets/today-access-count-widget";
import { PlannedAccessStatusWidget } from "./widgets/planned-access-status-widget";
import { LastAccessWidget } from "./widgets/last-access-widget";

const REFRESH_MS = 30_000;

export const WIDGET_REGISTRY: Record<WidgetId, WidgetDefinition> = {
  "today-access-count": {
    id: "today-access-count",
    title: "Accesos de hoy",
    component: TodayAccessCountWidget,
    defaultLayout: { i: "today-access-count", x:0, y: 0, w: 2, h: 3 },
    constraints: { minW: 1, minH: 3 },
    refreshMs: REFRESH_MS,
  },
  "planned-access-status": {
    id: "planned-access-status",
    title: "Solicitudes por estado",
    component: PlannedAccessStatusWidget,
    defaultLayout: { i: "planned-access-status", x: 5, y: 0, w: 2, h: 3 },
    constraints: { minW: 1, minH: 3 },
    refreshMs: REFRESH_MS,
  },
  "last-access": {
    id: "last-access",
    title: "Último acceso registrado",
    component: LastAccessWidget,
    defaultLayout: { i: "last-access", x: 2, y: 0, w: 2, h: 3 },
    constraints: { minW: 1, minH: 3 },
    refreshMs: REFRESH_MS,
  },
  "people-inside": {
    id: "people-inside",
    title: "Personas dentro de las instalaciones",
    component: PeopleInsideWidget,
    defaultLayout: { i: "people-inside", x: 0, y: 3, w: 6, h: 8 },
    constraints: { minW: 4, minH: 6 },
    refreshMs: REFRESH_MS,
  },
};

export function getWidgetDefinition(id: WidgetId): WidgetDefinition {
  return WIDGET_REGISTRY[id];
}
