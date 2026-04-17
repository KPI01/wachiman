import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";

export default function TrashUser({ userId }: { userId: string }) {
  return (
    <Form method="delete" action={`/admin/users/${userId}`}>
      <input name="id" value={userId} type="hidden" />
      <Button type="submit" variant="destructive">
        <TrashIcon />
      </Button>
    </Form>
  );
}
