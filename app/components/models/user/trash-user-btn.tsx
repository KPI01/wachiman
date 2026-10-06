import { useEffect, useRef } from "react";
import { LoaderCircleIcon, TrashIcon } from "lucide-react";
import { useFetcher } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";

export default function TrashUserBtn({
  userId,
  userName,
  onDeleted,
}: {
  userId: string;
  userName: string;
  onDeleted?: () => void;
}) {
  const formId = `delete-user-${userId}`;
  const fetcher = useFetcher<{ success?: boolean }>();
  const onDeletedRef = useRef(onDeleted);
  onDeletedRef.current = onDeleted;

  useEffect(() => {
    if (fetcher.data?.success) onDeletedRef.current?.();
  }, [fetcher.data]);

  return (
    <>
      <fetcher.Form id={formId} method="delete" action={`/admin/users?id=${userId}`}>
        <input name="id" value={userId} type="hidden" readOnly />
      </fetcher.Form>
      <AlertDialogContainer
        buttonVariant="destructive"
        buttonDisabled={fetcher.state !== "idle"}
        buttonAriaLabel={`Eliminar a ${userName}`}
        buttonLabel={
          <>
            {fetcher.state !== "idle" ? (
              <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
            ) : (
              <TrashIcon data-icon="inline-start" />
            )}
            Eliminar usuario
          </>
        }
        title="¿Eliminar usuario?"
        description={`Se desactivará a ${userName} y dejará de aparecer en la lista. Ya no podrá iniciar sesión.`}
        footer={
          <>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              form={formId}
              variant="destructive"
            >
              Eliminar usuario
            </AlertDialogAction>
          </>
        }
      />
    </>
  );
}
