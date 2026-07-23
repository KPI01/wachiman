import { LoaderCircleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
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
        <CancelPlannedAccessForm
          actionPath={props.actionPath}
          plannedAccessId={props.plannedAccessId}
          onSuccess={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

function CancelPlannedAccessForm({
  actionPath,
  plannedAccessId,
  onSuccess,
}: Props & { onSuccess: () => void }) {
  const fetcher = useFetcher<{ success?: boolean; errors?: unknown }>();
  const formId = `canceled-planned-access-${plannedAccessId}`;
  const isPending = fetcher.state !== "idle";
  const handledDataRef = useRef(fetcher.data);

  useEffect(() => {
    if (!fetcher.data || handledDataRef.current === fetcher.data) return;
    handledDataRef.current = fetcher.data;
    if (fetcher.data.success) {
      toast.success("Solicitud cancelada correctamente");
      onSuccess();
    } else if (fetcher.data.errors) {
      toast.error(`No se pudo cancelar la solicitud: ${getActionErrorMessage(fetcher.data.errors)}`);
    }
  }, [fetcher.data, fetcher.state, onSuccess]);

  return (
    <>
      <PopoverHeader>
        <PopoverTitle>Cancelar solicitud</PopoverTitle>
      </PopoverHeader>
      <fetcher.Form
        id={formId}
        method="post"
        action={actionPath}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="intent" value="decision" />
        <input type="hidden" name="id" value={plannedAccessId} />
        <input type="hidden" name="status" value="CANCELED" />
        <FieldWrapper label="Motivo *" htmlFor={`${formId}-reason`}>
          <Textarea
            id={`${formId}-reason`}
            name="decisionReason"
            required
            rows={4}
            placeholder="Explica por qué se cancela…"
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
          {isPending ? "Cancelando…" : "Confirmar cancelación"}
        </Button>
      </fetcher.Form>
    </>
  );
}
