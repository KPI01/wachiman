import { ArchiveIcon } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";

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

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={<ArchiveIcon />}
      buttonVariant="ghost"
      buttonSize="icon"
      title="Archivar documento"
      description="El documento dejará de estar vigente, pero se conservará como evidencia histórica."
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
