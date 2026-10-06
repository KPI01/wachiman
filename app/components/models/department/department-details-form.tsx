import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import type { Department } from "../../../../db/schema";
import EntityDetailsDialog from "~/components/models/shared/entity-details-dialog";
import DeleteDepartmentBtn from "~/components/models/department/delete-department-btn";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type DepartmentDetailsProps = {
  department: Department;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

export default function DepartmentDetailsForm({
  department,
  open,
  onOpenChange,
  showTrigger = true,
}: DepartmentDetailsProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;

  const formId = `department-form-${department.id}`;

  return (
    <EntityDetailsDialog
      open={open ?? localOpen}
      onOpenChange={onOpenChange ?? setLocalOpen}
      showTrigger={showTrigger}
      trigger={<InfoIcon aria-hidden="true" />}
      triggerLabel="Abrir ficha del departamento"
      title="Ficha del departamento"
      description={department.name}
      formId={formId}
      isSubmitting={patchFetcher.state !== "idle"}
      footerLeading={
        <DeleteDepartmentBtn
          departmentId={department.id}
          onDeleted={() => {
            setLocalOpen(false);
            onOpenChange?.(false);
          }}
        />
      }
    >
      <patchFetcher.Form
        id={formId}
        method="patch"
        action={`/admin/departments?id=${department.id}`}
        className="grid gap-4 md:grid-cols-2"
      >
        <h3 className="text-sm font-semibold md:col-span-2">Información del departamento</h3>
        <Input name="id" defaultValue={department.id} type="hidden" />
        <FieldWrapper
          label="Nombre"
          htmlFor={`name-${department.id}`}
          errors={getFieldErrors(patchErrors, "name")}
        >
          <Input
            id={`name-${department.id}`}
            name="name"
            defaultValue={department.name}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Slug"
          htmlFor={`slug-${department.id}`}
          errors={getFieldErrors(patchErrors, "slug")}
        >
          <Input
            id={`slug-${department.id}`}
            name="slug"
            defaultValue={department.slug}
            className="uppercase"
          />
        </FieldWrapper>
      </patchFetcher.Form>
    </EntityDetailsDialog>
  );
}
