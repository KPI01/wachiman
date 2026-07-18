import { useFetcher } from "react-router";
import type { PlannedAccessStatus } from "../../../../db/enums";
import { Button } from "~/components/ui/button";

export type AllowedAction = "APPROVE" | "REJECT" | "CANCEL";

type PlannedAccessStatusActionsProps = {
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
}: PlannedAccessStatusActionsProps) {
  const fetcher = useFetcher<{ errors?: unknown; success?: boolean }>();
  const isPending = fetcher.state !== "idle";

  if (status !== "PENDING_APPROVAL" && status !== "APPROVED") {
    return <span className="sr-only">Sin acciones disponibles</span>;
  }

  return (
    <fetcher.Form
      method="patch"
      action={actionPath}
      className="flex justify-end gap-2"
    >
      <input type="hidden" name="id" value={plannedAccessId} />
      {status === "PENDING_APPROVAL" ? (
        <>
          {allowedActions.includes("APPROVE") ? (
            <Button
              type="submit"
              name="status"
              value="APPROVED"
              size="sm"
              disabled={isPending}
            >
              Aprobar
            </Button>
          ) : null}
          {allowedActions.includes("REJECT") ? (
            <Button
              type="submit"
              name="status"
              value="REJECTED"
              size="sm"
              variant="destructive"
              disabled={isPending}
            >
              Rechazar
            </Button>
          ) : null}
          {allowedActions.includes("CANCEL") ? (
            <Button
              type="submit"
              name="status"
              value="CANCELED"
              size="sm"
              variant="outline"
              disabled={isPending}
            >
              Cancelar
            </Button>
          ) : null}
        </>
      ) : (
        <>
          {allowedActions.includes("CANCEL") ? (
            <Button
              type="submit"
              name="status"
              value="CANCELED"
              size="sm"
              variant="outline"
              disabled={isPending}
            >
              Cancelar
            </Button>
          ) : null}
        </>
      )}
    </fetcher.Form>
  );
}
