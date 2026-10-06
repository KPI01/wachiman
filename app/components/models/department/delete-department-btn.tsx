import DeleteEntityButton from "~/components/models/shared/delete-entity-button";

export default function DeleteDepartmentBtn({
  departmentId,
  onDeleted,
}: {
  departmentId: string;
  onDeleted?: () => void;
}) {
  return (
    <DeleteEntityButton
      id={departmentId}
      action={`/admin/departments?id=${departmentId}`}
      label="Eliminar departamento"
      onDeleted={onDeleted}
    />
  );
}
