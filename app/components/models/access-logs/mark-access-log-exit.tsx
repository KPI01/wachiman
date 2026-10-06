import { useEffect, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { toast } from "sonner";
import {
  FilePenLineIcon,
  LoaderCircleIcon,
  LogOutIcon,
} from "lucide-react";
import AlertDialogContainer, {
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import AccessLogSignature from "./access-log-signature";
import { getActionErrorMessage } from "~/lib/utils/action-errors";

type MarkAccessLogExitProps = {
  accessLogId: string;
  compact?: boolean;
  mode?: "operator" | "supervisor";
  signatureRequested?: boolean;
};

type ExitActionResult = {
  errors?: unknown;
  outcome?: "signed" | "requested" | "forced";
  success?: boolean;
};

export default function MarkAccessLogExit({
  accessLogId,
  compact = false,
  mode = "operator",
  signatureRequested = false,
}: MarkAccessLogExitProps) {
  if (mode === "supervisor") {
    return (
      <SupervisorExitActions
        accessLogId={accessLogId}
        compact={compact}
        signatureRequested={signatureRequested}
      />
    );
  }

  return <OperatorExitAction accessLogId={accessLogId} compact={compact} />;
}

function OperatorExitAction({
  accessLogId,
  compact,
}: {
  accessLogId: string;
  compact: boolean;
}) {
  const fetcher = useFetcher<ExitActionResult>();
  const { revalidate } = useRevalidator();
  const [open, setOpen] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [exitSignaturePayload, setExitSignaturePayload] = useState("");

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;

    if (fetcher.data.errors) {
      toast.error(getActionErrorMessage(fetcher.data.errors));
      return;
    }

    toast.success("Salida registrada correctamente");
    setOpen(false);
    setHasSignature(false);
    setExitSignaturePayload("");
    revalidate();
  }, [fetcher.data, fetcher.state, revalidate]);

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
      buttonLabel={compact ? <LogOutIcon aria-hidden="true" /> : "Marcar salida"}
      buttonVariant="outline"
      buttonSize={compact ? "icon-sm" : "sm"}
      buttonAriaLabel={compact ? "Marcar salida con firma" : undefined}
      buttonTooltip={compact ? "Marcar salida con firma" : undefined}
      title="Registrar salida"
      description="El operador de accesos debe recoger la firma del visitante para registrar su salida."
      footer={
        <>
          <AlertDialogCancel variant="outline">Volver</AlertDialogCancel>
          <Button
            type="submit"
            form={`mark-access-log-exit-${accessLogId}`}
            disabled={!hasSignature || fetcher.state !== "idle"}
          >
            {fetcher.state === "submitting" ? "Guardando..." : "Registrar salida"}
          </Button>
        </>
      }
    >
      <fetcher.Form
        id={`mark-access-log-exit-${accessLogId}`}
        method="post"
        action={`/access-log/${accessLogId}`}
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="intent" value="sign-exit" />
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

function SupervisorExitActions({
  accessLogId,
  compact,
  signatureRequested,
}: {
  accessLogId: string;
  compact: boolean;
  signatureRequested: boolean;
}) {
  const requestFetcher = useFetcher<ExitActionResult>();
  const forceFetcher = useFetcher<ExitActionResult>();
  const { revalidate } = useRevalidator();
  const [forceDialogOpen, setForceDialogOpen] = useState(false);
  const action = `/access-log/${accessLogId}`;

  useEffect(() => {
    if (requestFetcher.state !== "idle" || !requestFetcher.data) return;

    if (requestFetcher.data.errors) {
      toast.error(getActionErrorMessage(requestFetcher.data.errors));
      return;
    }

    toast.success("Solicitud de firma enviada al operador de accesos");
    revalidate();
  }, [requestFetcher.data, requestFetcher.state, revalidate]);

  useEffect(() => {
    if (forceFetcher.state !== "idle" || !forceFetcher.data) return;

    if (forceFetcher.data.errors) {
      toast.error(getActionErrorMessage(forceFetcher.data.errors));
      return;
    }

    toast.success("Acceso cerrado sin firma");
    setForceDialogOpen(false);
    revalidate();
  }, [forceFetcher.data, forceFetcher.state, revalidate]);

  function requestSignature() {
    requestFetcher.submit(
      { intent: "request-exit-signature" },
      { method: "post", action },
    );
  }

  function forceClose() {
    forceFetcher.submit({ intent: "force-exit" }, { method: "post", action });
  }

  const requestPending = requestFetcher.state !== "idle";
  const forcePending = forceFetcher.state !== "idle";
  const requestButton = (
    <Button
      type="button"
      variant="default"
      size={compact ? "icon-sm" : "sm"}
      aria-label={compact ? "Solicitar firma de salida" : undefined}
      disabled={signatureRequested || requestPending || forcePending}
      onClick={requestSignature}
    >
      {requestPending ? (
        <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
      ) : (
        <>
          <FilePenLineIcon aria-hidden="true" />
          {!compact ? "Solicitar firma" : null}
        </>
      )}
    </Button>
  );

  return (
    <div className="flex items-center justify-end gap-1">
      {compact ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{requestButton}</span>
          </TooltipTrigger>
          <TooltipContent>
            {signatureRequested ? "La firma ya ha sido solicitada" : "Solicitar firma"}
          </TooltipContent>
        </Tooltip>
      ) : (
        requestButton
      )}
      <AlertDialogContainer
        open={forceDialogOpen}
        onOpenChange={setForceDialogOpen}
        buttonLabel={
          compact ? <LogOutIcon aria-hidden="true" /> : "Cerrar sin firma"
        }
        buttonVariant="destructive"
        buttonSize={compact ? "icon-sm" : "sm"}
        buttonAriaLabel={compact ? "Cerrar acceso sin firma" : undefined}
        buttonTooltip={compact ? "Cerrar sin firma" : undefined}
        buttonDisabled={requestPending || forcePending}
        title="Cerrar acceso sin firma"
        description="El visitante no firmará su salida. El registro y la auditoría indicarán que el cierre fue forzado. ¿Quieres continuar?"
        footer={
          <>
            <AlertDialogCancel variant="outline">Volver</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={forcePending}
              onClick={forceClose}
            >
              {forcePending ? "Cerrando…" : "Cerrar sin firma"}
            </Button>
          </>
        }
      />
    </div>
  );
}
