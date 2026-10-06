import DeleteEntityButton from "~/components/models/shared/delete-entity-button";

export default function DeleteSiteBtn({
  siteId,
  actionPath = `/admin/sites?id=${siteId}`,
  onDeleted,
}: {
  siteId: string;
  actionPath?: string;
  onDeleted?: () => void;
}) {
  return <DeleteEntityButton id={siteId} action={actionPath} label="Eliminar centro" onDeleted={onDeleted} />;
}
