import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import AlertDialogContainer, {
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Button } from "~/components/ui/button";
import AccessLogSignature from "~/components/models/access-logs/access-log-signature";

type MarkAccessLogExitProps = {
  accessLogId: string;
};

export default function MarkAccessLogExit({
  accessLogId,
}: MarkAccessLogExitProps) {
  const fetcher = useFetcher<{ errors?: unknown }>();
  const [open, setOpen] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [exitSignaturePayload, setExitSignaturePayload] = useState("");

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data || fetcher.data.errors) {
      return;
    }

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
        <Button type="button" size="sm" variant="outline">
          Marcar salida
        </Button>
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
