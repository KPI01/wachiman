import type { Route } from "./+types/home";
import { DashboardGrid } from "~/components/dashboard/dashboard-grid";
import type { WidgetId } from "~/components/dashboard/types";

const ADMIN_WIDGETS: WidgetId[] = [
  "today-access-count",
  "planned-access-status",
  "last-access",
  "people-inside",
];

export function loader(_args: Route.LoaderArgs) {
  return null;
}

export default function AdminHome(_props: Route.ComponentProps) {
  return (
    <div className="space-y-6">
      <DashboardGrid
        storageKey="admin"
        widgetIds={ADMIN_WIDGETS}
        scope="all-sites"
      />
    </div>
  );
}
