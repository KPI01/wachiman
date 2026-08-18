import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import TableActionButton from "~/components/table-action-button";

export default function DeleteWorkCategoryBtn({
  workCategoryId,
  actionPath = "/admin/work-categories",
}: {
  workCategoryId: string;
  actionPath?: string;
}) {
  return (
    <Form method="delete" action={actionPath}>
      <input name="id" value={workCategoryId} type="hidden" />
      <TableActionButton
        type="submit"
        variant="destructive"
        label="Eliminar categoría laboral"
        icon={TrashIcon}
      />
    </Form>
  );
}
