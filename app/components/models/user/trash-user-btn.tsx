import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";

export default function TrashUserBtn({ userId }: { userId: string }) {
  return (
    <Form method="delete" action={`/admin/users?id=${userId}`}>
      <input name="id" value={userId} type="hidden" />
      <Button type="submit" variant="destructive" aria-label="Eliminar usuario">
        <TrashIcon />
      </Button>
    </Form>
  );
}
