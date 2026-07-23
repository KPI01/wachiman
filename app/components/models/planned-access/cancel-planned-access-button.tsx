import { BanIcon, LoaderCircleIcon } from "lucide-react";
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

export default function CancelPlannedAccessButton(props: Props) {
  const [open, setOpen] = useState(false);
  const navigation = useNavigation();
  const formId = `canceled-planned-access-${props.plannedAccessId}`;
  const isPending =
    navigation.state !== "idle" && navigation.formAction === props.actionPath;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label="Cancelar solicitud"
        >
          Cancelar
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <PopoverHeader>
          <PopoverTitle>Cancelar solicitud</PopoverTitle>
        </PopoverHeader>
        <Form
          id={formId}
          method="post"
          action={props.actionPath}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="intent" value="decision" />
          <input type="hidden" name="id" value={props.plannedAccessId} />
          <input type="hidden" name="status" value="CANCELED" />
          <FieldWrapper label="Motivo *" htmlFor={`${formId}-reason`}>
            <Textarea
              id={`${formId}-reason`}
              name="decisionReason"
              required
              rows={4}
              placeholder="Explica por qué se cancela…"
              aria-describedby={`${formId}-help`}
            />
          </FieldWrapper>
          <Button type="submit" variant="outline" disabled={isPending}>
            {isPending ? (
              <LoaderCircleIcon
                data-icon="inline-start"
                className="animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {isPending ? "Cancelar…" : "Confirmar cancelación"}
          </Button>
        </Form>
      </PopoverContent>
    </Popover>
  );
}
