import type { AllowedArea, Site, WorkCategory } from "../../../../db/schema";
import EditPlannedAccessForm from "./edit-planned-access-form";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";

export default function EditPlannedAccessButton({
  plannedAccess,
  sites,
  workCategories,
  allowedAreas,
  actionPath,
}: {
  plannedAccess: PlannedAccessListItem;
  sites: Array<Pick<Site, "id" | "name">>;
  workCategories: Array<Pick<WorkCategory, "id" | "name">>;
  allowedAreas: Array<Pick<AllowedArea, "id" | "name" | "siteId">>;
  actionPath: string;
}) {
  return (
    <EditPlannedAccessForm
      plannedAccess={plannedAccess}
      sites={sites}
      workCategories={workCategories}
      allowedAreas={allowedAreas}
      actionPath={actionPath}
    />
  );
}
