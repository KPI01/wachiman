import { PencilIcon } from "lucide-react";
import type { PlannedAccessStatus } from "../../../../db/enums";
import { Button } from "~/components/ui/button";
import CancelPlannedAccessButton from "./cancel-planned-access-button";
import RejectPlannedAccessButton from "./reject-planned-access-button";
import ApprovePlannedAccessButton from "./approve-planned-access-button";

export type AllowedAction = "EDIT" | "APPROVE" | "REJECT" | "CANCEL";

type Props = {
  plannedAccessId: string;
  status: PlannedAccessStatus;
  actionPath?: string;
  allowedActions?: AllowedAction[];
  onEdit?: () => void;
};

export default function PlannedAccessStatusActions({
  plannedAccessId,
  status,
  actionPath = "/admin/planned-access",
  allowedActions = ["EDIT", "APPROVE", "REJECT", "CANCEL"],
  onEdit,
}: Props) {
  if (status !== "PENDING_APPROVAL" && status !== "APPROVED") {
    return <span className="sr-only">Sin acciones disponibles</span>;
  }

  return (
    <div className="flex justify-end gap-1">
      {status === "PENDING_APPROVAL" &&
      allowedActions.includes("EDIT") &&
      onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Editar solicitud de acceso"
          title="Editar solicitud de acceso"
          onClick={onEdit}
        >
          <PencilIcon aria-hidden="true" />
        </Button>
      ) : null}
      {status === "PENDING_APPROVAL" && allowedActions.includes("APPROVE") ? (
        <ApprovePlannedAccessButton
          actionPath={actionPath}
          plannedAccessId={plannedAccessId}
        />
      ) : null}
      {status === "PENDING_APPROVAL" && allowedActions.includes("REJECT") ? (
        <RejectPlannedAccessButton
          actionPath={actionPath}
          plannedAccessId={plannedAccessId}
        />
      ) : null}
      {allowedActions.includes("CANCEL") ? (
        <CancelPlannedAccessButton
          actionPath={actionPath}
          plannedAccessId={plannedAccessId}
        />
      ) : null}
    </div>
  );
}
