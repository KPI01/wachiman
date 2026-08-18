import { ArchiveIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { getActionErrorMessage } from "~/lib/utils/action-errors";

type DeleteWorkerDocumentBtnProps = {
  documentId: string;
  workerId: string;
};

export default function DeleteWorkerDocumentBtn({
  documentId,
  workerId,
}: DeleteWorkerDocumentBtnProps) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    const result = fetcher.data as { errors?: unknown };
    if (result.errors) {
      toast.error(getActionErrorMessage(result.errors));
      return;
    }
    toast.success("Documento archivado");
  }, [fetcher.data, fetcher.state]);

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={<ArchiveIcon aria-hidden="true" />}
      buttonVariant="ghost"
      buttonSize="icon-sm"
      buttonAriaLabel="Archivar documento"
      buttonTooltip="Archivar documento"
      title="Archivar documento"
      description="El documento dejará de estar vigente, pero se conservará como documento histórico."
      footer={
        <>
          <AlertDialogCancel variant="secondary">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="secondary"
            onClick={() => {
              fetcher.submit(
                { id: documentId },
                {
                  method: "delete",
                  action: `/api/external-workers/${workerId}/documents/${documentId}`,
                },
              );
              setOpen(false);
            }}
          >
            Archivar
          </AlertDialogAction>
        </>
      }
    />
  );
}
