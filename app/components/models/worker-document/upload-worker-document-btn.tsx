import { UploadIcon } from "lucide-react";
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
import { DOCUMENT_TYPE_LABELS } from "~/lib/models/worker-document";
import {
  defaultRecordTypeForDocumentType,
  DOCUMENT_EXPIRY_BASIS_LABELS,
  DOCUMENT_RECORD_TYPE_LABELS,
} from "~/lib/models/worker-document";
import type { DocumentRecordType, DocumentType } from "../../../../db/enums";

type UploadWorkerDocumentBtnProps = {
  workerId: string;
};

export default function UploadWorkerDocumentBtn({
  workerId,
}: UploadWorkerDocumentBtnProps) {
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>("TRAINING");
  const [recordType, setRecordType] = useState<DocumentRecordType>("TRAINING_EVIDENCE");
  const fetcher = useFetcher<{ errors?: string }>();

  const formId = `upload-document-${workerId}`;

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={
        <>
          <UploadIcon />
          <span className="text-base">Subir documento</span>
        </>
      }
      buttonClassName="w-fit"
      title="Subir Documento"
      description="Registra la evidencia, su alcance y las fechas que correspondan. Una capacitacion no necesita vencimiento si la regla aplicable no lo exige. Tamano maximo: 5 MB."
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form={formId}>
            Subir
          </AlertDialogAction>
        </>
      }
    >
      <fetcher.Form
        id={formId}
        method="post"
        action={`/api/external-workers/${workerId}/documents`}
        encType="multipart/form-data"
        className="grid gap-4"
      >
        <FieldWrapper label="Tipo de documento *" htmlFor={`documentType-${workerId}`}>
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
            <SelectTrigger className="w-full">
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

        <FieldWrapper label="Naturaleza de la evidencia *" htmlFor={`recordType-${workerId}`}>
          <Select
            name="recordType"
            value={recordType}
            onValueChange={(value) => setRecordType(value as DocumentRecordType)}
            required
          >
            <SelectTrigger className="w-full">
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
            id={`validUntil-${workerId}`}
            name="validUntil"
            type="date"
          />
        </FieldWrapper>

        <FieldWrapper label="Base de la vigencia *" htmlFor={`expiryBasis-${workerId}`}>
          <Select name="expiryBasis" defaultValue="NOT_APPLICABLE" required>
            <SelectTrigger className="w-full">
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
          <FieldWrapper label="Realizado el" htmlFor={`completedAt-${workerId}`}>
            <Input id={`completedAt-${workerId}`} name="completedAt" type="date" />
          </FieldWrapper>
          <FieldWrapper label="Emitido el" htmlFor={`issuedAt-${workerId}`}>
            <Input id={`issuedAt-${workerId}`} name="issuedAt" type="date" />
          </FieldWrapper>
          <FieldWrapper label="Vigente desde" htmlFor={`validFrom-${workerId}`}>
            <Input id={`validFrom-${workerId}`} name="validFrom" type="date" />
          </FieldWrapper>
          <FieldWrapper label="Ultima practica" htmlFor={`lastPerformedAt-${workerId}`}>
            <Input id={`lastPerformedAt-${workerId}`} name="lastPerformedAt" type="date" />
          </FieldWrapper>
          <FieldWrapper label="Reciclaje previsto" htmlFor={`refresherDueAt-${workerId}`}>
            <Input id={`refresherDueAt-${workerId}`} name="refresherDueAt" type="date" />
          </FieldWrapper>
          <FieldWrapper label="Revision prevista" htmlFor={`reviewDueAt-${workerId}`}>
            <Input id={`reviewDueAt-${workerId}`} name="reviewDueAt" type="date" />
          </FieldWrapper>
        </div>

        <FieldWrapper label="Emisor o autorizador" htmlFor={`issuer-${workerId}`}>
          <Input id={`issuer-${workerId}`} name="issuer" />
        </FieldWrapper>

        <FieldWrapper label="Fuente de la regla" htmlFor={`legalSource-${workerId}`}>
          <Input id={`legalSource-${workerId}`} name="legalSource" placeholder="Norma, convenio, politica o evaluacion" />
        </FieldWrapper>

        <FieldWrapper label="Alcance de tarea" htmlFor={`taskScope-${workerId}`}>
          <Input id={`taskScope-${workerId}`} name="taskScope" placeholder="Oficio, tarea o zona" />
        </FieldWrapper>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrapper label="Riesgos cubiertos" htmlFor={`riskScopes-${workerId}`}>
            <Input id={`riskScopes-${workerId}`} name="riskScopes" placeholder="Separados por comas" />
          </FieldWrapper>
          <FieldWrapper label="Equipos cubiertos" htmlFor={`equipmentTypes-${workerId}`}>
            <Input id={`equipmentTypes-${workerId}`} name="equipmentTypes" placeholder="Separados por comas" />
          </FieldWrapper>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrapper label="Jurisdiccion" htmlFor={`jurisdiction-${workerId}`}>
            <Input id={`jurisdiction-${workerId}`} name="jurisdiction" placeholder="Ej. ES-Murcia" />
          </FieldWrapper>
          <FieldWrapper label="Sector" htmlFor={`sector-${workerId}`}>
            <Input id={`sector-${workerId}`} name="sector" />
          </FieldWrapper>
          <FieldWrapper label="Version de procedimiento" htmlFor={`procedureVersion-${workerId}`}>
            <Input id={`procedureVersion-${workerId}`} name="procedureVersion" />
          </FieldWrapper>
          <FieldWrapper label="Autorizador empresarial" htmlFor={`employerAuthorizer-${workerId}`}>
            <Input id={`employerAuthorizer-${workerId}`} name="employerAuthorizer" />
          </FieldWrapper>
        </div>

        <FieldWrapper label="Archivo *" htmlFor={`file-${workerId}`}>
          <Input
            id={`file-${workerId}`}
            name="file"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            required
          />
        </FieldWrapper>

        <FieldWrapper label="Notas" htmlFor={`notes-${workerId}`}>
          <Input id={`notes-${workerId}`} name="notes" />
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
