import { LoaderCircleIcon, UploadIcon } from "lucide-react";
import { useEffect, useState } from "react";
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
import { DOCUMENT_TYPE_LABELS } from "~/lib/models/worker-document";
import {
  defaultRecordTypeForDocumentType,
  DOCUMENT_EXPIRY_BASIS_LABELS,
  DOCUMENT_RECORD_TYPE_LABELS,
} from "~/lib/models/worker-document";
import type { DocumentRecordType, DocumentType } from "../../../../db/enums";

type UploadWorkerDocumentBtnProps = {
  workerId?: string;
  actionPath?: string;
  personId?: string;
  workCategoryId?: string;
  initialDocumentType?: DocumentType;
};

export default function UploadWorkerDocumentBtn({
  workerId,
  actionPath,
  personId,
  workCategoryId,
  initialDocumentType = "TRAINING",
}: UploadWorkerDocumentBtnProps) {
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>(initialDocumentType);
  const [recordType, setRecordType] = useState<DocumentRecordType>(defaultRecordTypeForDocumentType(initialDocumentType));
  const fetcher = useFetcher<{ errors?: string }>();
  const isPending = fetcher.state !== "idle";

  const formKey = workerId ?? personId ?? "worker";
  const formId = `upload-document-${formKey}-${documentType}`;
  const formAction = actionPath ?? `/api/external-workers/${workerId}/documents`;

  useEffect(() => {
    if (fetcher.data && !fetcher.data.errors) setOpen(false);
  }, [fetcher.data]);

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={
        <>
          <UploadIcon />
           <span className="text-base">Subir evidencia</span>
        </>
      }
      buttonClassName="w-fit"
       title="Subir evidencia"
      description="Registra la evidencia, su alcance y las fechas que correspondan. Una capacitacion no necesita vencimiento si la regla aplicable no lo exige. Tamano maximo: 5 MB."
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form={formId} disabled={isPending}>
            {isPending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" aria-hidden="true" /> : null}
            {isPending ? "Subiendo…" : "Subir"}
          </AlertDialogAction>
        </>
      }
    >
      <fetcher.Form
        id={formId}
        method="post"
         action={formAction}
        encType="multipart/form-data"
        className="grid gap-4"
      >
         {personId ? <input type="hidden" name="intent" value="upload-document" /> : null}
         {personId ? <input type="hidden" name="personId" value={personId} /> : null}
         {workCategoryId ? <input type="hidden" name="workCategoryId" value={workCategoryId} /> : null}
         <FieldWrapper label="Tipo de documento *" htmlFor={`documentType-${formKey}`}>
          <Select
            name="documentType"
            value={documentType}
            onValueChange={(value) => {
              const nextType = value as DocumentType;
              setDocumentType(nextType);
              setRecordType(defaultRecordTypeForDocumentType(nextType));
            }}
            required
          >
           <SelectTrigger id={`documentType-${formKey}`} className="w-full">
              <SelectValue placeholder="Seleccionar tipo..." />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="IDENTIFICATION">
                {DOCUMENT_TYPE_LABELS.IDENTIFICATION}
              </SelectItem>
              <SelectItem value="TRAINING">
                {DOCUMENT_TYPE_LABELS.TRAINING}
              </SelectItem>
              <SelectItem value="SPECIAL_PERMISSION">
                {DOCUMENT_TYPE_LABELS.SPECIAL_PERMISSION}
              </SelectItem>
            </SelectContent>
          </Select>
        </FieldWrapper>

         <FieldWrapper label="Naturaleza de la evidencia *" htmlFor={`recordType-${formKey}`}>
          <Select
            name="recordType"
            value={recordType}
            onValueChange={(value) => setRecordType(value as DocumentRecordType)}
            required
          >
           <SelectTrigger id={`recordType-${formKey}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {Object.entries(DOCUMENT_RECORD_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>

        <FieldWrapper
          label="Vigente hasta"
          htmlFor={`validUntil-${workerId}`}
        >
          <Input
             id={`validUntil-${formKey}`}
            name="validUntil"
            type="date"
          />
        </FieldWrapper>

           <FieldWrapper label="Base de la vigencia *" htmlFor={`expiryBasis-${formKey}`}>
          <Select name="expiryBasis" defaultValue="NOT_APPLICABLE" required>
             <SelectTrigger id={`expiryBasis-${formKey}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {Object.entries(DOCUMENT_EXPIRY_BASIS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>

        <div className="grid gap-4 sm:grid-cols-2">
           <FieldWrapper label="Realizado el" htmlFor={`completedAt-${formKey}`}>
             <Input id={`completedAt-${formKey}`} name="completedAt" type="date" />
          </FieldWrapper>
           <FieldWrapper label="Emitido el" htmlFor={`issuedAt-${formKey}`}>
             <Input id={`issuedAt-${formKey}`} name="issuedAt" type="date" />
          </FieldWrapper>
           <FieldWrapper label="Vigente desde" htmlFor={`validFrom-${formKey}`}>
             <Input id={`validFrom-${formKey}`} name="validFrom" type="date" />
          </FieldWrapper>
           <FieldWrapper label="Ultima practica" htmlFor={`lastPerformedAt-${formKey}`}>
             <Input id={`lastPerformedAt-${formKey}`} name="lastPerformedAt" type="date" />
          </FieldWrapper>
           <FieldWrapper label="Reciclaje previsto" htmlFor={`refresherDueAt-${formKey}`}>
             <Input id={`refresherDueAt-${formKey}`} name="refresherDueAt" type="date" />
          </FieldWrapper>
           <FieldWrapper label="Revision prevista" htmlFor={`reviewDueAt-${formKey}`}>
             <Input id={`reviewDueAt-${formKey}`} name="reviewDueAt" type="date" />
          </FieldWrapper>
        </div>

         <FieldWrapper label="Emisor o autorizador" htmlFor={`issuer-${formKey}`}>
           <Input id={`issuer-${formKey}`} name="issuer" />
        </FieldWrapper>

         <FieldWrapper label="Fuente de la regla" htmlFor={`legalSource-${formKey}`}>
           <Input id={`legalSource-${formKey}`} name="legalSource" placeholder="Norma, convenio, política o evaluación…" />
        </FieldWrapper>

         <FieldWrapper label="Alcance de tarea" htmlFor={`taskScope-${formKey}`}>
           <Input id={`taskScope-${formKey}`} name="taskScope" placeholder="Oficio, tarea o zona…" />
        </FieldWrapper>

        <div className="grid gap-4 sm:grid-cols-2">
           <FieldWrapper label="Riesgos cubiertos" htmlFor={`riskScopes-${formKey}`}>
             <Input id={`riskScopes-${formKey}`} name="riskScopes" placeholder="Separados por comas…" />
          </FieldWrapper>
           <FieldWrapper label="Equipos cubiertos" htmlFor={`equipmentTypes-${formKey}`}>
             <Input id={`equipmentTypes-${formKey}`} name="equipmentTypes" placeholder="Separados por comas…" />
          </FieldWrapper>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
           <FieldWrapper label="Jurisdicción" htmlFor={`jurisdiction-${formKey}`}>
             <Input id={`jurisdiction-${formKey}`} name="jurisdiction" placeholder="Ej. ES-Murcia…" />
          </FieldWrapper>
           <FieldWrapper label="Sector" htmlFor={`sector-${formKey}`}>
             <Input id={`sector-${formKey}`} name="sector" />
          </FieldWrapper>
           <FieldWrapper label="Versión de procedimiento" htmlFor={`procedureVersion-${formKey}`}>
             <Input id={`procedureVersion-${formKey}`} name="procedureVersion" />
          </FieldWrapper>
           <FieldWrapper label="Autorizador empresarial" htmlFor={`employerAuthorizer-${formKey}`}>
             <Input id={`employerAuthorizer-${formKey}`} name="employerAuthorizer" />
          </FieldWrapper>
        </div>

         <FieldWrapper label="Archivo *" htmlFor={`file-${formKey}`}>
          <Input
             id={`file-${formKey}`}
            name="file"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            required
          />
        </FieldWrapper>

         <FieldWrapper label="Notas" htmlFor={`notes-${formKey}`}>
           <Input id={`notes-${formKey}`} name="notes" />
        </FieldWrapper>

         {fetcher.data?.errors && (
           <p className="text-sm text-destructive" role="alert" aria-live="polite">
            {Array.isArray(fetcher.data.errors)
              ? fetcher.data.errors.join(", ")
              : fetcher.data.errors}
          </p>
        )}
      </fetcher.Form>
    </AlertDialogContainer>
  );
}
