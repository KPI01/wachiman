import DeleteEntityButton from "~/components/models/shared/delete-entity-button";

export default function DeleteWorkCategoryBtn({
  workCategoryId,
  actionPath = "/admin/work-categories",
  onDeleted,
}: {
  workCategoryId: string;
  actionPath?: string;
  onDeleted?: () => void;
}) {
  return <DeleteEntityButton id={workCategoryId} action={actionPath} label="Eliminar tipo de trabajo" onDeleted={onDeleted} />;
}
