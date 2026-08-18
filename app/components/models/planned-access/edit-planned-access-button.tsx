import type { Site } from "../../../../db/schema";
import EditPlannedAccessForm from "./edit-planned-access-form";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";

export default function EditPlannedAccessButton({
  plannedAccess,
  sites,
  actionPath,
}: {
  plannedAccess: PlannedAccessListItem;
  sites: Array<Pick<Site, "id" | "name">>;
  actionPath: string;
}) {
  return (
    <EditPlannedAccessForm
      plannedAccess={plannedAccess}
      sites={sites}
      actionPath={actionPath}
    />
  );
}
