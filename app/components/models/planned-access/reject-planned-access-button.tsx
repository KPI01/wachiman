import { CircleXIcon, LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { Form, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Textarea } from "~/components/ui/textarea";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";

type Props = {
  actionPath: string;
  plannedAccessId: string;
};

export default function RejectPlannedAccessButton(props: Props) {
  const [open, setOpen] = useState(false);
  const navigation = useNavigation();
  const formId = `rejected-planned-access-${props.plannedAccessId}`;
  const isPending =
    navigation.state !== "idle" && navigation.formAction === props.actionPath;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          aria-label="Rechazar solicitud"
        >
          Rechazar
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <PopoverHeader>
          <PopoverTitle>Rechazar solicitud</PopoverTitle>
        </PopoverHeader>
        <Form
          id={formId}
          method="post"
          action={props.actionPath}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="intent" value="decision" />
          <input type="hidden" name="id" value={props.plannedAccessId} />
          <input type="hidden" name="status" value="REJECTED" />
          <FieldWrapper label="Motivo *" htmlFor={`${formId}-reason`}>
            <Textarea
              id={`${formId}-reason`}
              name="decisionReason"
              required
              rows={4}
              placeholder="Explica por qué se rechaza…"
              aria-describedby={`${formId}-help`}
            />
          </FieldWrapper>
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? (
              <LoaderCircleIcon
                data-icon="inline-start"
                className="animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {isPending ? "Rechazar…" : "Confirmar rechazo"}
          </Button>
        </Form>
      </PopoverContent>
    </Popover>
  );
}
