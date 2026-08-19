import type { PlannedAccessStatus } from "../../../../db/enums";
import CancelPlannedAccessButton from "./cancel-planned-access-button";
import RejectPlannedAccessButton from "./reject-planned-access-button";
import EditPlannedAccessButton from "./edit-planned-access-button";
import ApprovePlannedAccessButton from "./approve-planned-access-button";
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
    <div className="flex justify-end gap-1">
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
        // Comentado: antes el botón enlazaba a la página de aprobación.
        // <TableActionButton
        //   label="Aprobar solicitud"
        //   icon={CheckIcon}
        //   to={`${actionPath}/${plannedAccessId}/approve`}
        // />
        <ApprovePlannedAccessButton
          actionPath={actionPath}
          plannedAccessId={plannedAccessId}
        />
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
