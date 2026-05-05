import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";

export default function DeleteDepartment({
  departmentId,
}: {
  departmentId: string;
}) {
  return (
    <Form method="delete" action={`/admin/departments?id=${departmentId}`}>
      <input name="id" value={departmentId} type="hidden" />
      <Button type="submit" variant="destructive">
        <TrashIcon />
      </Button>
    </Form>
  );
}
