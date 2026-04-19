import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
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

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data || fetcher.data.errors) {
      return;
    }

    setOpen(false);
    setHasSignature(false);
  }, [fetcher.data, fetcher.state]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setHasSignature(false);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          Marcar salida
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar salida</AlertDialogTitle>
          <AlertDialogDescription>
            Solicita al visitante su firma para registrar la salida.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <fetcher.Form
          id={`mark-access-log-exit-${accessLogId}`}
          method="post"
          action={`/access-log/${accessLogId}`}
          className="space-y-4"
        >
          <AccessLogSignature
            key={`exit-signature-${open}-${accessLogId}`}
            inputName="exitSignaturePayload"
            onSignatureChange={setHasSignature}
          />
        </fetcher.Form>
        <AlertDialogFooter>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <Button
            type="submit"
            form={`mark-access-log-exit-${accessLogId}`}
            disabled={!hasSignature || fetcher.state !== "idle"}
          >
            {fetcher.state === "submitting" ? "Enviando..." : "Enviar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
