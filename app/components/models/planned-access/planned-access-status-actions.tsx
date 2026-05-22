import { useFetcher } from "react-router";
import type { PlannedAccessStatus } from "../../../../prisma/generated/prisma/client";
import { Button } from "~/components/ui/button";

type PlannedAccessStatusActionsProps = {
  plannedAccessId: string;
  status: PlannedAccessStatus;
};

export default function PlannedAccessStatusActions({
  plannedAccessId,
  status,
}: PlannedAccessStatusActionsProps) {
  const fetcher = useFetcher<{ errors?: unknown; success?: boolean }>();
  const isPending = fetcher.state !== "idle";

  if (status !== "PENDING_APPROVAL" && status !== "APPROVED") {
    return <span className="sr-only">Sin acciones disponibles</span>;
  }

  return (
    <fetcher.Form
      method="patch"
      action="/admin/planned-access"
      className="flex justify-end gap-2"
    >
      <input type="hidden" name="id" value={plannedAccessId} />
      {status === "PENDING_APPROVAL" ? (
        <>
          <Button
            type="submit"
            name="status"
            value="APPROVED"
            size="sm"
            disabled={isPending}
          >
            Aprobar
          </Button>
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
        </>
      ) : null}
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
    </fetcher.Form>
  );
}
