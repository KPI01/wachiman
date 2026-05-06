import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import type { Department } from "../../../../prisma/generated/prisma/client";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type DepartmentDetailsProps = {
  department: Department;
};

export default function DepartmentDetailsForm({ department }: DepartmentDetailsProps) {
  const [open, setOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;

  const formId = `department-form-${department.id}`;

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={<InfoIcon />}
      buttonVariant="secondary"
      title="Ficha de Departamento"
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form={formId}>
            Enviar
          </AlertDialogAction>
        </>
      }
    >
      <patchFetcher.Form
        id={formId}
        method="patch"
        action={`/admin/departments?id=${department.id}`}
        className="space-y-4"
      >
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
    </AlertDialogContainer>
  );
}