import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import TableActionButton from "~/components/table-action-button";

export default function DeleteSiteBtn({ siteId }: { siteId: string }) {
  return (
    <Form method="delete" action={`/admin/sites?id=${siteId}`}>
      <input name="id" value={siteId} type="hidden" />
      <TableActionButton
        type="submit"
        variant="destructive"
        label="Eliminar centro"
        icon={TrashIcon}
      />
    </Form>
  );
}
