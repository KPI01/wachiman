import { TrashIcon } from "lucide-react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";

export default function DeleteSiteBtn({ siteId }: { siteId: string }) {
  return (
    <Form method="delete" action={`/admin/sites?id=${siteId}`}>
      <input name="id" value={siteId} type="hidden" />
      <Button type="submit" variant="destructive">
        <TrashIcon />
      </Button>
    </Form>
  );
}
