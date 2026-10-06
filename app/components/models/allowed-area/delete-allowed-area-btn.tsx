import DeleteEntityButton from "~/components/models/shared/delete-entity-button";

export default function DeleteAllowedAreaBtn({
  allowedAreaId,
  actionPath = "/admin/allowed-areas",
  onDeleted,
}: {
  allowedAreaId: string;
  actionPath?: string;
  onDeleted?: () => void;
}) {
  return <DeleteEntityButton id={allowedAreaId} action={actionPath} label="Eliminar área autorizada" onDeleted={onDeleted} />;
}
