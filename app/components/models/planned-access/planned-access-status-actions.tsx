import type { PlannedAccessStatus } from "../../../../db/enums";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import CancelPlannedAccessButton from "./cancel-planned-access-button";
import RejectPlannedAccessButton from "./reject-planned-access-button";
import EditPlannedAccessButton from "./edit-planned-access-button";
import type { Site } from "../../../../db/schema";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";

export type AllowedAction = "EDIT" | "APPROVE" | "REJECT" | "CANCEL";

type Props = {
  plannedAccessId: string;
  status: PlannedAccessStatus;
  actionPath?: string;
  allowedActions?: AllowedAction[];
  plannedAccess?: PlannedAccessListItem;
  sites?: Array<Pick<Site, "id" | "name">>;
};

export default function PlannedAccessStatusActions({
  plannedAccessId,
  status,
  actionPath = "/admin/planned-access",
  allowedActions = ["EDIT", "APPROVE", "REJECT", "CANCEL"],
  plannedAccess,
  sites = [],
}: Props) {
  if (status !== "PENDING_APPROVAL" && status !== "APPROVED") {
    return <span className="sr-only">Sin acciones disponibles</span>;
  }

  return (
    <div className="flex justify-end gap-2">
      {status === "PENDING_APPROVAL" &&
      allowedActions.includes("EDIT") &&
      plannedAccess ? (
        <EditPlannedAccessButton
          plannedAccess={plannedAccess}
          sites={sites}
          actionPath={actionPath}
        />
      ) : null}
      {status === "PENDING_APPROVAL" && allowedActions.includes("APPROVE") ? (
        <Button asChild size="sm">
          <Link to={`${actionPath}/${plannedAccessId}/approve`}>Aprobar</Link>
        </Button>
      ) : null}
      {status === "PENDING_APPROVAL" && allowedActions.includes("REJECT") ? (
        <RejectPlannedAccessButton actionPath={actionPath} plannedAccessId={plannedAccessId} />
      ) : null}
      {allowedActions.includes("CANCEL") ? (
        <CancelPlannedAccessButton actionPath={actionPath} plannedAccessId={plannedAccessId} />
      ) : null}
    </div>
  );
}
