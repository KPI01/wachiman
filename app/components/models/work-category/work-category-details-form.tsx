import { InfoIcon } from "lucide-react";
import { useState } from "react";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import type { WorkCategory } from "../../../../db/schema";
import { useFetcher } from "react-router";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
// Comentado: los requisitos documentales ya no se muestran.
// import { Checkbox } from "~/components/ui/checkbox";
import { getFieldErrors } from "~/lib/utils/zod-errors";
// import { Field, FieldDescription, FieldLegend, FieldSet } from "~/components/ui/field";

type WorkCategoryDetailsProps = {
  workCategory: WorkCategory;
  actionPath?: string;
};

export default function WorkCategoryDetailsForm({
  workCategory,
  actionPath = "/admin/work-categories",
}: WorkCategoryDetailsProps) {
  const [open, setOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;
  const formId = `work-category-form-${workCategory.id}`;

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={<InfoIcon aria-hidden="true" />}
      buttonVariant="secondary"
      buttonSize="icon-sm"
      buttonAriaLabel="Editar categoría laboral"
      buttonTooltip="Editar categoría laboral"
      title="Ficha de Categoria Laboral"
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
        action={actionPath}
        className="space-y-4"
      >
        <Input name="id" defaultValue={workCategory.id} type="hidden" />
        <FieldWrapper
          label="Nombre"
          htmlFor={`name-${workCategory.id}`}
          errors={getFieldErrors(patchErrors, "name")}
        >
          <Input
            id={`name-${workCategory.id}`}
            name="name"
            defaultValue={workCategory.name}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Descripcion"
          htmlFor={`description-${workCategory.id}`}
          errors={getFieldErrors(patchErrors, "description")}
        >
          <Input
            id={`description-${workCategory.id}`}
            name="description"
            defaultValue={workCategory.description ?? ""}
          />
        </FieldWrapper>
{/* Comentado: los requisitos documentales ya no se muestran. */}
        {/* <FieldSet> */}
        {/*   <FieldLegend>Requisitos documentales</FieldLegend> */}
        {/*   <FieldDescription> */}
        {/*     Estos requisitos se aplican al aprobar y registrar el acceso. */}
        {/*   </FieldDescription> */}
        {/*   <Field orientation="horizontal"> */}
        {/*     <Checkbox */}
        {/*       id={`requiresTraining-${workCategory.id}`} */}
        {/*       name="requiresTraining" */}
        {/*       value="true" */}
        {/*       defaultChecked={Boolean(workCategory.requiresTraining)} */}
        {/*     /> */}
        {/*     <label htmlFor={`requiresTraining-${workCategory.id}`} className="text-sm font-medium"> */}
        {/*       Exigir documento de formación */}
        {/*     </label> */}
        {/*   </Field> */}
        {/*   <Field orientation="horizontal"> */}
        {/*     <Checkbox */}
        {/*       id={`requiresSpecialPermission-${workCategory.id}`} */}
        {/*       name="requiresSpecialPermission" */}
        {/*       value="true" */}
        {/*       defaultChecked={Boolean(workCategory.requiresSpecialPermission)} */}
        {/*     /> */}
        {/*     <label htmlFor={`requiresSpecialPermission-${workCategory.id}`} className="text-sm font-medium"> */}
        {/*       Exigir autorización o permiso especial */}
        {/*     </label> */}
        {/*   </Field> */}
        {/* </FieldSet> */}
      </patchFetcher.Form>
    </AlertDialogContainer>
  );
}
