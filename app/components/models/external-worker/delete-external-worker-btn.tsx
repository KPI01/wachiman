import DeleteEntityButton from "~/components/models/shared/delete-entity-button";

export default function DeleteExternalWorkerBtn({
  workerId,
  actionPath = "/admin/external-workers",
  onDeleted,
}: {
  workerId: string;
  actionPath?: string;
  onDeleted?: () => void;
}) {
  return <DeleteEntityButton id={workerId} action={actionPath} label="Eliminar trabajador externo" onDeleted={onDeleted} />;
}
