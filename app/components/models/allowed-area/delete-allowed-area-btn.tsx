import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import TableActionButton from "~/components/table-action-button";

export default function DeleteAllowedAreaBtn({
  allowedAreaId,
  actionPath = "/admin/allowed-areas",
}: {
  allowedAreaId: string;
  actionPath?: string;
}) {
  return (
    <Form method="delete" action={actionPath}>
      <input name="id" value={allowedAreaId} type="hidden" />
      <TableActionButton
        type="submit"
        variant="destructive"
        label="Eliminar área autorizada"
        icon={TrashIcon}
      />
    </Form>
  );
}
