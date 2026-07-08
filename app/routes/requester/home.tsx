import type { Route } from "./+types/home";
import { DashboardGrid } from "~/components/dashboard/dashboard-grid";
import type { WidgetId } from "~/components/dashboard/types";

export function loader(_args: Route.LoaderArgs) {
  return null;
}

const REQUESTER_WIDGETS: WidgetId[] = [
  "requester-planned-status",
  "requester-people-inside",
];

export default function RequesterHome(_props: Route.ComponentProps) {
  return (
    <div className="space-y-6">
      <DashboardGrid
        storageKey="requester"
        widgetIds={REQUESTER_WIDGETS}
        scope="session-site"
      />
    </div>
  );
}
