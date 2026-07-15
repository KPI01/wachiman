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

type UploadWorkerDocumentBtnProps = {
  workerId: string;
};

export default function UploadWorkerDocumentBtn({
  workerId,
}: UploadWorkerDocumentBtnProps) {
  const [open, setOpen] = useState(false);
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
      description="Selecciona el tipo de documento, fecha de expiracion y el archivo a subir. Tamano maximo: 5 MB. Formatos: JPEG, PNG, PDF, Word."
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
          <Select name="documentType" required>
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
            </SelectContent>
          </Select>
        </FieldWrapper>

        <FieldWrapper
          label="Fecha de expiracion *"
          htmlFor={`expiryDate-${workerId}`}
        >
          <Input
            id={`expiryDate-${workerId}`}
            name="expiryDate"
            type="date"
            required
          />
        </FieldWrapper>

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
