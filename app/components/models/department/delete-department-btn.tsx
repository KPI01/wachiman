import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import TableActionButton from "~/components/table-action-button";

export default function DeleteDepartmentBtn({
  departmentId,
}: {
  departmentId: string;
}) {
  return (
    <Form method="delete" action={`/admin/departments?id=${departmentId}`}>
      <input name="id" value={departmentId} type="hidden" />
      <TableActionButton
        type="submit"
        variant="destructive"
        label="Eliminar departamento"
        icon={TrashIcon}
      />
    </Form>
  );
}
