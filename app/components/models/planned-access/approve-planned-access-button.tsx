import { CheckIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { toast } from "sonner";
import TableActionButton from "~/components/table-action-button";
import { getActionErrorMessage } from "~/lib/utils/action-errors";

type Props = {
  actionPath: string;
  plannedAccessId: string;
};

export default function ApprovePlannedAccessButton({
  actionPath,
  plannedAccessId,
}: Props) {
  const fetcher = useFetcher<{ success?: boolean; errors?: unknown }>();
  const revalidator = useRevalidator();
  const formId = `approve-planned-access-${plannedAccessId}`;
  const isPending = fetcher.state !== "idle";
  const handledDataRef = useRef(fetcher.data);

  useEffect(() => {
    if (!fetcher.data || handledDataRef.current === fetcher.data) return;
    handledDataRef.current = fetcher.data;
    if (fetcher.data.success) {
      toast.success("Solicitud aprobada correctamente");
      revalidator.revalidate();
    } else if (fetcher.data.errors) {
      toast.error(
        `No se pudo aprobar la solicitud: ${getActionErrorMessage(fetcher.data.errors)}`,
      );
    }
  }, [fetcher.data, fetcher.state, revalidator]);

  return (
    <fetcher.Form id={formId} method="post" action={actionPath}>
      <input type="hidden" name="intent" value="decision" />
      <input type="hidden" name="id" value={plannedAccessId} />
      <input type="hidden" name="status" value="APPROVED" />
      <TableActionButton
        label="Aprobar solicitud"
        icon={CheckIcon}
        type="submit"
        disabled={isPending}
      />
    </fetcher.Form>
  );
}