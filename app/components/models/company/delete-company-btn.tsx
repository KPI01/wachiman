import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import TableActionButton from "~/components/table-action-button";

export default function DeleteCompanyBtn({
  companyId,
  actionPath = "/admin/companies",
}: {
  companyId: string;
  actionPath?: string;
}) {
  return (
    <Form method="delete" action={actionPath}>
      <input name="id" value={companyId} type="hidden" />
      <TableActionButton
        type="submit"
        variant="destructive"
        label="Eliminar empresa"
        icon={TrashIcon}
      />
    </Form>
  );
}
