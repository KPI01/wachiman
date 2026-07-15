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
  DOCUMENT_STATUS_LABELS,
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
      description={`${DOCUMENT_TYPE_LABELS[document.documentType]} - ${document.fileName}`}
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

        <FieldWrapper label="Estado" htmlFor={`status-${document.id}`}>
          <Select name="status" defaultValue={document.status}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="VALIDATED">
                {DOCUMENT_STATUS_LABELS.VALIDATED}
              </SelectItem>
              <SelectItem value="EXPIRED">
                {DOCUMENT_STATUS_LABELS.EXPIRED}
              </SelectItem>
              <SelectItem value="ARCHIVED">
                {DOCUMENT_STATUS_LABELS.ARCHIVED}
              </SelectItem>
            </SelectContent>
          </Select>
        </FieldWrapper>

        <FieldWrapper
          label="Fecha de expiracion"
          htmlFor={`expiryDate-${document.id}`}
        >
          <Input
            id={`expiryDate-${document.id}`}
            name="expiryDate"
            type="date"
            defaultValue={formatTimestamp({
              date: document.expiryDate,
              template: "yyyy-MM-dd",
            })}
          />
        </FieldWrapper>

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
