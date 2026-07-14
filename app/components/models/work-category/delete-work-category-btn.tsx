import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";

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
      <Button type="submit" variant="destructive">
        <TrashIcon />
      </Button>
    </Form>
  );
}
