import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";

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
      <Button type="submit" variant="destructive">
        <TrashIcon />
      </Button>
    </Form>
  );
}
