import { BanIcon, LoaderCircleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
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
import { getActionErrorMessage } from "~/lib/utils/action-errors";

type Props = {
  actionPath: string;
  plannedAccessId: string;
};

export default function CancelPlannedAccessButton(props: Props) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<{ success?: boolean; errors?: unknown }>();
  const formId = `canceled-planned-access-${props.plannedAccessId}`;
  const isPending = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.success) {
      toast.success("Solicitud cancelada");
      setOpen(false);
    } else if (fetcher.data.errors) {
      toast.error(getActionErrorMessage(fetcher.data.errors));
    }
  }, [fetcher.data, fetcher.state]);

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
        <fetcher.Form
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
        </fetcher.Form>
      </PopoverContent>
    </Popover>
  );
}
