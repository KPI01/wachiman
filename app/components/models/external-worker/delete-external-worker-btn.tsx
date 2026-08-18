import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import TableActionButton from "~/components/table-action-button";

export default function DeleteExternalWorkerBtn({
  workerId,
  actionPath = "/admin/external-workers",
}: {
  workerId: string;
  actionPath?: string;
}) {
  return (
    <Form method="delete" action={actionPath}>
      <input name="id" value={workerId} type="hidden" />
      <TableActionButton
        type="submit"
        variant="destructive"
        label="Eliminar trabajador externo"
        icon={TrashIcon}
      />
    </Form>
  );
}
