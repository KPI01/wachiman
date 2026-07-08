import type { Route } from "./+types/home";
import { DashboardGrid } from "~/components/dashboard/dashboard-grid";
import type { WidgetId } from "~/components/dashboard/types";

export function loader(_args: Route.LoaderArgs) {
  return null;
}

const APPROVER_WIDGETS: WidgetId[] = [
  "today-access-count",
  "planned-access-status",
  "last-access",
  "people-inside",
];

export default function ApproverHome(_props: Route.ComponentProps) {
  return (
    <div className="space-y-6">
      <DashboardGrid
        storageKey="approver"
        widgetIds={APPROVER_WIDGETS}
        scope="session-site"
      />
    </div>
  );
}
