import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import AlertDialogContainer, {
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Button } from "~/components/ui/button";
import AccessLogSignature from "./access-log-signature";
import { getActionErrorMessage } from "~/lib/utils/action-errors";
import TableActionButton from "~/components/table-action-button";
import { LogOutIcon } from "lucide-react";

type MarkAccessLogExitProps = {
  accessLogId: string;
  compact?: boolean;
};

export default function MarkAccessLogExit({
  accessLogId,
  compact = false,
}: MarkAccessLogExitProps) {
  const fetcher = useFetcher<{ errors?: unknown }>();
  const [open, setOpen] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [exitSignaturePayload, setExitSignaturePayload] = useState("");

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) {
      return;
    }

    if (fetcher.data.errors) {
      toast.error(getActionErrorMessage(fetcher.data.errors));
      return;
    }

    toast.success("Salida registrada correctamente");
    setOpen(false);
    setHasSignature(false);
    setExitSignaturePayload("");
  }, [fetcher.data, fetcher.state]);

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setHasSignature(false);
          setExitSignaturePayload("");
        }
      }}
      triggerAsChild
      buttonLabel={
        compact ? (
          <TableActionButton
            label="Marcar salida"
            icon={LogOutIcon}
            variant="outline"
          />
        ) : (
          <Button type="button" size="sm" variant="outline">
            Marcar salida
          </Button>
        )
      }
      title="Confirmar salida"
      description="Solicita al visitante su firma para registrar la salida."
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <Button
            type="submit"
            form={`mark-access-log-exit-${accessLogId}`}
            disabled={!hasSignature || fetcher.state !== "idle"}
          >
            {fetcher.state === "submitting" ? "Enviando..." : "Enviar"}
          </Button>
        </>
      }
    >
      <fetcher.Form
        id={`mark-access-log-exit-${accessLogId}`}
        method="post"
        action={`/access-log/${accessLogId}`}
        className="space-y-4"
      >
        <input
          type="hidden"
          name="exitSignaturePayload"
          value={exitSignaturePayload}
        />
        <AccessLogSignature
          key={`exit-signature-${open}-${accessLogId}`}
          onSignatureChange={setHasSignature}
          onSignaturePayloadChange={setExitSignaturePayload}
        />
      </fetcher.Form>
    </AlertDialogContainer>
  );
}
