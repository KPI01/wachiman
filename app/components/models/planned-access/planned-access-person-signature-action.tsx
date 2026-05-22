import { AlertTriangleIcon, PenLineIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import AlertDialogContainer, {
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import AccessLogSignature from "~/components/models/access-logs/access-log-signature";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import type { PlannedAccessListItem } from "~/lib/database/planned-access.server";

type PlannedAccessPerson = PlannedAccessListItem["plannedAccessPersons"][number];

type PlannedAccessPersonSignatureActionProps = {
  plannedAccessId: string;
  person: PlannedAccessPerson;
  disabled?: boolean;
};

function getPersonFullName(person: PlannedAccessPerson) {
  return [
    person.firstNameSnapshot,
    person.middleNameSnapshot,
    person.lastNameSnapshot,
    person.secondLastNameSnapshot,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function PlannedAccessPersonSignatureAction({
  plannedAccessId,
  person,
  disabled = false,
}: PlannedAccessPersonSignatureActionProps) {
  const fetcher = useFetcher<{ success?: boolean; errors?: unknown }>();
  const [open, setOpen] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [entrySignaturePayload, setEntrySignaturePayload] = useState("");
  const formId = `planned-access-signature-${plannedAccessId}-${person.id}`;
  const errorMessage =
    typeof fetcher.data?.errors === "string"
      ? fetcher.data.errors
      : fetcher.data?.errors
        ? "No se pudo registrar el acceso planificado."
        : null;

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data || fetcher.data.errors) {
      return;
    }

    setOpen(false);
    setHasSignature(false);
    setEntrySignaturePayload("");
  }, [fetcher.data, fetcher.state]);

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setHasSignature(false);
          setEntrySignaturePayload("");
        }
      }}
      triggerAsChild
      buttonLabel={
        <Button type="button" size="sm" variant="outline" disabled={disabled}>
          <PenLineIcon data-icon="inline-start" />
          Solicitar firma
        </Button>
      }
      title="Firma para acceso planificado"
      description={`Solicita la firma de ${getPersonFullName(person)} para registrar su ingreso.`}
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <Button
            type="submit"
            form={formId}
            disabled={!hasSignature || fetcher.state !== "idle"}
          >
            {fetcher.state === "submitting" ? "Enviando..." : "Registrar acceso"}
          </Button>
        </>
      }
    >
      <fetcher.Form
        id={formId}
        method="post"
        action="/operator?index"
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="intent" value="planned-access-signature" />
        <input type="hidden" name="plannedAccessId" value={plannedAccessId} />
        <input type="hidden" name="plannedAccessPersonId" value={person.id} />
        <input
          type="hidden"
          name="entrySignaturePayload"
          value={entrySignaturePayload}
        />

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <p className="font-medium">{getPersonFullName(person)}</p>
          <p className="text-muted-foreground">DNI/NIE: {person.legalIdSnapshot}</p>
        </div>

        <AccessLogSignature
          key={`planned-entry-signature-${open}-${person.id}`}
          onSignatureChange={setHasSignature}
          onSignaturePayloadChange={setEntrySignaturePayload}
        />
      </fetcher.Form>
    </AlertDialogContainer>
  );
}
