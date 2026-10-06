import DeleteEntityButton from "~/components/models/shared/delete-entity-button";

export default function DeleteCompanyBtn({
  companyId,
  actionPath = "/admin/companies",
  onDeleted,
}: {
  companyId: string;
  actionPath?: string;
  onDeleted?: () => void;
}) {
  return <DeleteEntityButton id={companyId} action={actionPath} label="Eliminar empresa" onDeleted={onDeleted} />;
}
