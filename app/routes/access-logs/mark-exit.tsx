import { Form } from "react-router";
import { Button } from "~/components/ui/button";

type MarkAccessLogExitProps = {
  accessLogId: string;
};

export default function MarkAccessLogExit({
  accessLogId,
}: MarkAccessLogExitProps) {
  return (
    <Form method="post" action={`/access-log/${accessLogId}`}>
      <Button type="submit" size="sm" variant="outline">
        Marcar salida
      </Button>
    </Form>
  );
}
