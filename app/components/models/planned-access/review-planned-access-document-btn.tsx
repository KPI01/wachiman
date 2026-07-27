import { ShieldCheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { toast } from "sonner";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { DOCUMENT_TYPE_LABELS } from "~/lib/models/worker-document";
import { getActionErrorMessage } from "~/lib/utils/action-errors";

type ReviewPlannedAccessDocumentBtnProps = {
  actionPath: string;
  documentId: string;
  documentType: keyof typeof DOCUMENT_TYPE_LABELS;
  fileName: string;
  personId: string;
};

export default function ReviewPlannedAccessDocumentBtn({
  actionPath,
  documentId,
  documentType,
  fileName,
  personId,
}: ReviewPlannedAccessDocumentBtnProps) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<"VALIDATED" | "REJECTED">("VALIDATED");
  const fetcher = useFetcher<{ errors?: unknown; success?: boolean }>();
  const revalidator = useRevalidator();
  const formId = `review-planned-document-${documentId}`;

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.errors) {
      toast.error(getActionErrorMessage(fetcher.data.errors));
      return;
    }
    toast.success("Decisión del documento registrada");
    setOpen(false);
    revalidator.revalidate();
  }, [fetcher.data, fetcher.state, revalidator]);

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={<ShieldCheckIcon />}
      buttonVariant="ghost"
      buttonSize="icon"
      title="Revisar documento"
      description={`Decide sobre ${DOCUMENT_TYPE_LABELS[documentType]}: ${fileName}.`}
      footer={
        <>
          <AlertDialogCancel variant="secondary">Cerrar</AlertDialogCancel>
          <AlertDialogAction type="submit" form={formId}>
            Registrar decisión
          </AlertDialogAction>
        </>
      }
    >
      <fetcher.Form id={formId} method="post" action={actionPath} className="grid gap-4">
        <input type="hidden" name="intent" value="review-document" />
        <input type="hidden" name="documentId" value={documentId} />
        <input type="hidden" name="personId" value={personId} />
        <FieldWrapper label="Decisión" htmlFor={`${formId}-decision`}>
          <Select
            name="reviewDecision"
            value={decision}
            onValueChange={(value) => setDecision(value as "VALIDATED" | "REJECTED")}
          >
            <SelectTrigger id={`${formId}-decision`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="VALIDATED">Validar documento</SelectItem>
              <SelectItem value="REJECTED">Rechazar documento</SelectItem>
            </SelectContent>
          </Select>
        </FieldWrapper>
        <FieldWrapper
          label={decision === "REJECTED" ? "Motivo de la revisión *" : "Motivo de la revisión (opcional)"}
          htmlFor={`${formId}-reason`}
        >
          <Textarea
            id={`${formId}-reason`}
            name="reviewReason"
            required={decision === "REJECTED"}
            placeholder="Indica qué has comprobado y el motivo de la decisión."
          />
        </FieldWrapper>
        {fetcher.data?.errors ? (
          <p className="text-sm text-destructive" role="alert">
            {getActionErrorMessage(fetcher.data.errors)}
          </p>
        ) : null}
      </fetcher.Form>
    </AlertDialogContainer>
  );
}
