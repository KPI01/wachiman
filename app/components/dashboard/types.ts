import type { DashboardScope } from "~/lib/services/dashboard.server";

export type WidgetId =
  | "people-inside"
  | "today-access-count"
  | "planned-access-status"
  | "last-access";

export type WidgetLayout = {
  i: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type WidgetConstraints = {
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
};

export type WidgetComponentProps = {
  scope: DashboardScope;
  editMode: boolean;
};

export type WidgetDefinition = {
  id: WidgetId;
  title: string;
  component: React.ComponentType<WidgetComponentProps>;
  defaultLayout: WidgetLayout;
  constraints: WidgetConstraints;
  refreshMs: number;
};

export type DashboardGridProps = {
  storageKey: string;
  widgetIds: WidgetId[];
  scope: DashboardScope;
};
