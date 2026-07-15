import { TrashIcon } from "lucide-react";
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
      buttonLabel={<TrashIcon />}
      buttonVariant="destructive"
      buttonSize="icon"
      title="Eliminar documento"
      description="Esta accion no se puede deshacer. El archivo sera eliminado permanentemente."
      footer={
        <>
          <AlertDialogCancel variant="secondary">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
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
            Eliminar
          </AlertDialogAction>
        </>
      }
    />
  );
}
