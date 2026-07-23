import type { PlannedAccessStatus } from "../../../../db/enums";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import CancelPlannedAccessButton from "./cancel-planned-access-button";
import RejectPlannedAccessButton from "./reject-planned-access-button";

export type AllowedAction = "APPROVE" | "REJECT" | "CANCEL";

type Props = {
  plannedAccessId: string;
  status: PlannedAccessStatus;
  actionPath?: string;
  allowedActions?: AllowedAction[];
};

export default function PlannedAccessStatusActions({
  plannedAccessId,
  status,
  actionPath = "/admin/planned-access",
  allowedActions = ["APPROVE", "REJECT", "CANCEL"],
}: Props) {
  if (status !== "PENDING_APPROVAL" && status !== "APPROVED") {
    return <span className="sr-only">Sin acciones disponibles</span>;
  }

  return (
    <div className="flex justify-end gap-2">
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
