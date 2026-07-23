import { ShieldCheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import type { WorkerDocumentListItem } from "~/lib/database/worker-document.server";
import { DOCUMENT_TYPE_LABELS } from "~/lib/models/worker-document";
import { getActionErrorMessage } from "~/lib/utils/action-errors";

type ReviewWorkerDocumentBtnProps = {
  document: WorkerDocumentListItem;
  workerId: string;
};

export default function ReviewWorkerDocumentBtn({
  document,
  workerId,
}: ReviewWorkerDocumentBtnProps) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<{ errors?: string }>();
  const formId = `review-document-${document.id}`;

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.errors) {
      toast.error(getActionErrorMessage(fetcher.data.errors));
      return;
    }
    toast.success("Revisión documental registrada");
    setOpen(false);
  }, [fetcher.data, fetcher.state]);

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={<ShieldCheckIcon />}
      buttonVariant="ghost"
      buttonSize="icon"
      title="Revisar documento"
      description={`Decide sobre ${DOCUMENT_TYPE_LABELS[document.documentType]}: ${document.fileName}. La decisión y la evidencia quedarán registradas.`}
      footer={
        <>
          <AlertDialogCancel variant="secondary">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form={formId}>
            Registrar decisión
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
        <FieldWrapper label="Decisión" htmlFor={`review-decision-${document.id}`}>
          <Select name="reviewDecision" defaultValue="VALIDATED">
            <SelectTrigger id={`review-decision-${document.id}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="VALIDATED">Validar evidencia</SelectItem>
              <SelectItem value="REJECTED">Rechazar evidencia</SelectItem>
            </SelectContent>
          </Select>
        </FieldWrapper>
        <FieldWrapper label="Motivo de la revisión *" htmlFor={`review-reason-${document.id}`}>
          <Textarea
            id={`review-reason-${document.id}`}
            name="reviewReason"
            required
            placeholder="Indica la evidencia comprobada y el motivo de la decisión."
          />
        </FieldWrapper>
        {fetcher.data?.errors ? (
          <p className="text-sm text-destructive">{fetcher.data.errors}</p>
        ) : null}
      </fetcher.Form>
    </AlertDialogContainer>
  );
}
