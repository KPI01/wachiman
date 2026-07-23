import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import {
  DOCUMENT_EXPIRY_BASIS_LABELS,
  DOCUMENT_RECORD_TYPE_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "~/lib/models/worker-document";
import { formatTimestamp } from "~/lib/utils";
import type { WorkerDocumentListItem } from "~/lib/database/worker-document.server";

type UpdateWorkerDocumentBtnProps = {
  document: WorkerDocumentListItem;
  workerId: string;
};

export default function UpdateWorkerDocumentBtn({
  document,
  workerId,
}: UpdateWorkerDocumentBtnProps) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<{ errors?: string }>();

  const formId = `update-document-${document.id}`;

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={<PencilIcon />}
      buttonVariant="ghost"
      buttonSize="icon"
      title="Editar Documento"
      description={`${DOCUMENT_TYPE_LABELS[document.documentType]} - ${document.fileName}. Solo puede editarse mientras esté pendiente de revisión.`}
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form={formId}>
            Guardar
          </AlertDialogAction>
        </>
      }
    >
      <fetcher.Form
        id={formId}
        method="patch"
        action={`/api/external-workers/${workerId}/documents/${document.id}`}
        className="grid gap-4"
      >
        <input name="id" value={document.id} type="hidden" />

        <FieldWrapper label="Naturaleza de la evidencia" htmlFor={`recordType-${document.id}`}>
          <Select name="recordType" defaultValue={document.recordType}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              {Object.entries(DOCUMENT_RECORD_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>

        <FieldWrapper
          label="Vigente hasta"
          htmlFor={`validUntil-${document.id}`}
        >
          <Input
            id={`validUntil-${document.id}`}
            name="validUntil"
            type="date"
            defaultValue={document.validUntil ? formatTimestamp({
              date: document.validUntil,
              template: "yyyy-MM-dd",
            }) : ""}
          />
        </FieldWrapper>

        <FieldWrapper label="Base de la vigencia" htmlFor={`expiryBasis-${document.id}`}>
          <Select name="expiryBasis" defaultValue={document.expiryBasis}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              {Object.entries(DOCUMENT_EXPIRY_BASIS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrapper label="Realizado el" htmlFor={`completedAt-${document.id}`}>
            <Input id={`completedAt-${document.id}`} name="completedAt" type="date" defaultValue={document.completedAt ? formatTimestamp({ date: document.completedAt, template: "yyyy-MM-dd" }) : ""} />
          </FieldWrapper>
          <FieldWrapper label="Emitido el" htmlFor={`issuedAt-${document.id}`}>
            <Input id={`issuedAt-${document.id}`} name="issuedAt" type="date" defaultValue={document.issuedAt ? formatTimestamp({ date: document.issuedAt, template: "yyyy-MM-dd" }) : ""} />
          </FieldWrapper>
          <FieldWrapper label="Vigente desde" htmlFor={`validFrom-${document.id}`}>
            <Input id={`validFrom-${document.id}`} name="validFrom" type="date" defaultValue={document.validFrom ? formatTimestamp({ date: document.validFrom, template: "yyyy-MM-dd" }) : ""} />
          </FieldWrapper>
          <FieldWrapper label="Ultima practica" htmlFor={`lastPerformedAt-${document.id}`}>
            <Input id={`lastPerformedAt-${document.id}`} name="lastPerformedAt" type="date" defaultValue={document.lastPerformedAt ? formatTimestamp({ date: document.lastPerformedAt, template: "yyyy-MM-dd" }) : ""} />
          </FieldWrapper>
          <FieldWrapper label="Reciclaje previsto" htmlFor={`refresherDueAt-${document.id}`}>
            <Input id={`refresherDueAt-${document.id}`} name="refresherDueAt" type="date" defaultValue={document.refresherDueAt ? formatTimestamp({ date: document.refresherDueAt, template: "yyyy-MM-dd" }) : ""} />
          </FieldWrapper>
          <FieldWrapper label="Revision prevista" htmlFor={`reviewDueAt-${document.id}`}>
            <Input id={`reviewDueAt-${document.id}`} name="reviewDueAt" type="date" defaultValue={document.reviewDueAt ? formatTimestamp({ date: document.reviewDueAt, template: "yyyy-MM-dd" }) : ""} />
          </FieldWrapper>
        </div>

        <FieldWrapper label="Emisor o autorizador" htmlFor={`issuer-${document.id}`}>
          <Input id={`issuer-${document.id}`} name="issuer" defaultValue={document.issuer ?? ""} />
        </FieldWrapper>

        <FieldWrapper label="Fuente de la regla" htmlFor={`legalSource-${document.id}`}>
          <Input id={`legalSource-${document.id}`} name="legalSource" defaultValue={document.legalSource ?? ""} />
        </FieldWrapper>

        <FieldWrapper label="Alcance de tarea" htmlFor={`taskScope-${document.id}`}>
          <Input id={`taskScope-${document.id}`} name="taskScope" defaultValue={document.taskScope ?? ""} />
        </FieldWrapper>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrapper label="Riesgos cubiertos" htmlFor={`riskScopes-${document.id}`}>
            <Input id={`riskScopes-${document.id}`} name="riskScopes" defaultValue={document.riskScopes?.join(", ") ?? ""} />
          </FieldWrapper>
          <FieldWrapper label="Equipos cubiertos" htmlFor={`equipmentTypes-${document.id}`}>
            <Input id={`equipmentTypes-${document.id}`} name="equipmentTypes" defaultValue={document.equipmentTypes?.join(", ") ?? ""} />
          </FieldWrapper>
          <FieldWrapper label="Jurisdiccion" htmlFor={`jurisdiction-${document.id}`}>
            <Input id={`jurisdiction-${document.id}`} name="jurisdiction" defaultValue={document.jurisdiction ?? ""} />
          </FieldWrapper>
          <FieldWrapper label="Sector" htmlFor={`sector-${document.id}`}>
            <Input id={`sector-${document.id}`} name="sector" defaultValue={document.sector ?? ""} />
          </FieldWrapper>
          <FieldWrapper label="Version de procedimiento" htmlFor={`procedureVersion-${document.id}`}>
            <Input id={`procedureVersion-${document.id}`} name="procedureVersion" defaultValue={document.procedureVersion ?? ""} />
          </FieldWrapper>
          <FieldWrapper label="Autorizador empresarial" htmlFor={`employerAuthorizer-${document.id}`}>
            <Input id={`employerAuthorizer-${document.id}`} name="employerAuthorizer" defaultValue={document.employerAuthorizer ?? ""} />
          </FieldWrapper>
        </div>

        <FieldWrapper label="Notas" htmlFor={`notes-${document.id}`}>
          <Input
            id={`notes-${document.id}`}
            name="notes"
            defaultValue={document.notes ?? ""}
          />
        </FieldWrapper>

        {fetcher.data?.errors && (
          <p className="text-sm text-destructive">
            {Array.isArray(fetcher.data.errors)
              ? fetcher.data.errors.join(", ")
              : fetcher.data.errors}
          </p>
        )}
      </fetcher.Form>
    </AlertDialogContainer>
  );
}
