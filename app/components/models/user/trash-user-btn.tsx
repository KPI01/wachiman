import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import TableActionButton from "~/components/table-action-button";

export default function TrashUserBtn({ userId }: { userId: string }) {
  return (
    <Form method="delete" action={`/admin/users?id=${userId}`}>
      <input name="id" value={userId} type="hidden" />
      <TableActionButton
        type="submit"
        variant="destructive"
        label="Eliminar usuario"
        icon={TrashIcon}
      />
    </Form>
  );
}
