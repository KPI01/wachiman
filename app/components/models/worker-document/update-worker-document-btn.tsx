import { PencilIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
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
  DOCUMENT_RECORD_TYPES_BY_DOCUMENT_TYPE,
  hasDocumentField,
} from "~/lib/models/worker-document";
import type { DocumentField } from "~/lib/models/worker-document";
import type { DocumentRecordType } from "../../../../db/enums";
import { formatTimestamp } from "~/lib/utils";
import type { WorkerDocumentListItem } from "~/lib/database/worker-document.server";
import { getActionErrorMessage } from "~/lib/utils/action-errors";

type UpdateWorkerDocumentBtnProps = {
  document: WorkerDocumentListItem;
  workerId: string;
};

export default function UpdateWorkerDocumentBtn({
  document,
  workerId,
}: UpdateWorkerDocumentBtnProps) {
  const [open, setOpen] = useState(false);
  const [recordType, setRecordType] = useState<DocumentRecordType>(document.recordType);
  const [hasValidityDate, setHasValidityDate] = useState(Boolean(document.validUntil));
  const fetcher = useFetcher<{ errors?: string }>();

  const formId = `update-document-${document.id}`;
  const show = (field: DocumentField) => hasDocumentField(recordType, field);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.errors) {
      toast.error(getActionErrorMessage(fetcher.data.errors));
      return;
    }
     toast.success("Datos del documento actualizados");
    setOpen(false);
  }, [fetcher.data, fetcher.state]);

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
        <Input name="id" value={document.id} type="hidden" readOnly />

        <FieldWrapper label="Naturaleza del documento" htmlFor={`recordType-${document.id}`}>
           <Select name="recordType" value={recordType} onValueChange={(value) => setRecordType(value as DocumentRecordType)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              {DOCUMENT_RECORD_TYPES_BY_DOCUMENT_TYPE[document.documentType].map((value) => (
                <SelectItem key={value} value={value}>{DOCUMENT_RECORD_TYPE_LABELS[value]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>

        {show("validUntil") ? <FieldWrapper
          label="Vigente hasta"
          htmlFor={`validUntil-${document.id}`}
        >
          <Input
            id={`validUntil-${document.id}`}
            name="validUntil"
            type="date"
            onChange={(event) => setHasValidityDate(Boolean(event.currentTarget.value))}
            defaultValue={document.validUntil ? formatTimestamp({
              date: document.validUntil,
              template: "yyyy-MM-dd",
            }) : ""}
          />
        </FieldWrapper> : null}

        {show("validUntil") && hasValidityDate ? <FieldWrapper label="Origen de la vigencia" htmlFor={`expiryBasis-${document.id}`}>
          <Select name="expiryBasis" defaultValue={document.expiryBasis}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              {Object.entries(DOCUMENT_EXPIRY_BASIS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {show("completedAt") ? <FieldWrapper label="Realizado el" htmlFor={`completedAt-${document.id}`}>
            <Input id={`completedAt-${document.id}`} name="completedAt" type="date" defaultValue={document.completedAt ? formatTimestamp({ date: document.completedAt, template: "yyyy-MM-dd" }) : ""} />
          </FieldWrapper> : null}
          {show("issuedAt") ? <FieldWrapper label="Emitido el" htmlFor={`issuedAt-${document.id}`}>
            <Input id={`issuedAt-${document.id}`} name="issuedAt" type="date" defaultValue={document.issuedAt ? formatTimestamp({ date: document.issuedAt, template: "yyyy-MM-dd" }) : ""} />
          </FieldWrapper> : null}
          {show("validFrom") ? <FieldWrapper label="Vigente desde" htmlFor={`validFrom-${document.id}`}>
            <Input id={`validFrom-${document.id}`} name="validFrom" type="date" defaultValue={document.validFrom ? formatTimestamp({ date: document.validFrom, template: "yyyy-MM-dd" }) : ""} />
          </FieldWrapper> : null}
          {show("lastPerformedAt") ? <FieldWrapper label="Ultima practica" htmlFor={`lastPerformedAt-${document.id}`}>
            <Input id={`lastPerformedAt-${document.id}`} name="lastPerformedAt" type="date" defaultValue={document.lastPerformedAt ? formatTimestamp({ date: document.lastPerformedAt, template: "yyyy-MM-dd" }) : ""} />
          </FieldWrapper> : null}
          {show("refresherDueAt") ? <FieldWrapper label="Reciclaje previsto" htmlFor={`refresherDueAt-${document.id}`}>
            <Input id={`refresherDueAt-${document.id}`} name="refresherDueAt" type="date" defaultValue={document.refresherDueAt ? formatTimestamp({ date: document.refresherDueAt, template: "yyyy-MM-dd" }) : ""} />
          </FieldWrapper> : null}
          {show("reviewDueAt") ? <FieldWrapper label="Revision prevista" htmlFor={`reviewDueAt-${document.id}`}>
            <Input id={`reviewDueAt-${document.id}`} name="reviewDueAt" type="date" defaultValue={document.reviewDueAt ? formatTimestamp({ date: document.reviewDueAt, template: "yyyy-MM-dd" }) : ""} />
          </FieldWrapper> : null}
        </div>

        {show("issuer") ? <FieldWrapper label="Emisor" htmlFor={`issuer-${document.id}`}>
          <Input id={`issuer-${document.id}`} name="issuer" defaultValue={document.issuer ?? ""} />
        </FieldWrapper> : null}

        {show("legalSource") ? <FieldWrapper label="Fuente normativa o procedencia" htmlFor={`legalSource-${document.id}`}>
          <Input id={`legalSource-${document.id}`} name="legalSource" defaultValue={document.legalSource ?? ""} />
        </FieldWrapper> : null}

        {show("taskScope") ? <FieldWrapper label="Tarea, oficio o zona" htmlFor={`taskScope-${document.id}`}>
          <Input id={`taskScope-${document.id}`} name="taskScope" defaultValue={document.taskScope ?? ""} />
        </FieldWrapper> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {show("riskScopes") ? <FieldWrapper label="Riesgos cubiertos" htmlFor={`riskScopes-${document.id}`}>
            <Input id={`riskScopes-${document.id}`} name="riskScopes" defaultValue={document.riskScopes?.join(", ") ?? ""} />
          </FieldWrapper> : null}
          {show("equipmentTypes") ? <FieldWrapper label="Equipos cubiertos" htmlFor={`equipmentTypes-${document.id}`}>
            <Input id={`equipmentTypes-${document.id}`} name="equipmentTypes" defaultValue={document.equipmentTypes?.join(", ") ?? ""} />
          </FieldWrapper> : null}
          {show("jurisdiction") ? <FieldWrapper label="Jurisdiccion" htmlFor={`jurisdiction-${document.id}`}>
            <Input id={`jurisdiction-${document.id}`} name="jurisdiction" defaultValue={document.jurisdiction ?? ""} />
          </FieldWrapper> : null}
          {show("sector") ? <FieldWrapper label="Sector" htmlFor={`sector-${document.id}`}>
            <Input id={`sector-${document.id}`} name="sector" defaultValue={document.sector ?? ""} />
          </FieldWrapper> : null}
          {show("procedureVersion") ? <FieldWrapper label="Version de procedimiento" htmlFor={`procedureVersion-${document.id}`}>
            <Input id={`procedureVersion-${document.id}`} name="procedureVersion" defaultValue={document.procedureVersion ?? ""} />
          </FieldWrapper> : null}
          {show("employerAuthorizer") ? <FieldWrapper label="Autorizador empresarial" htmlFor={`employerAuthorizer-${document.id}`}>
            <Input id={`employerAuthorizer-${document.id}`} name="employerAuthorizer" defaultValue={document.employerAuthorizer ?? ""} />
          </FieldWrapper> : null}
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
