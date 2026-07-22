import { Link, Form } from "react-router";
import type { PlannedAccessStatus } from "../../../../db/enums";
import { Button } from "~/components/ui/button";

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

  const simpleAction = (
    action: "REJECT" | "CANCEL",
    variant: "destructive" | "outline",
  ) => (
    <Form method="post" action={actionPath} className="inline-flex">
      <input type="hidden" name="id" value={plannedAccessId} />
      <input
        type="hidden"
        name="status"
        value={action === "REJECT" ? "REJECTED" : "CANCELED"}
      />
      <Button type="submit" size="sm" variant={variant}>
        {action === "REJECT" ? "Rechazar" : "Cancelar"}
      </Button>
    </Form>
  );

  return (
    <div className="flex justify-end gap-2">
      {status === "PENDING_APPROVAL" && allowedActions.includes("APPROVE") ? (
        <Button asChild type="button" size="sm">
          <Link to={`${actionPath}/${plannedAccessId}/approve`}>Aprobar</Link>
        </Button>
      ) : null}
      {status === "PENDING_APPROVAL" && allowedActions.includes("REJECT")
        ? simpleAction("REJECT", "destructive")
        : null}
      {allowedActions.includes("CANCEL")
        ? simpleAction("CANCEL", "outline")
        : null}
    </div>
  );
}
