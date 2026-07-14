import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";

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
      <Button type="submit" variant="destructive">
        <TrashIcon />
      </Button>
    </Form>
  );
}
