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
import { Checkbox } from "~/components/ui/checkbox";
import { getFieldErrors } from "~/lib/utils/zod-errors";

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
      buttonLabel={<InfoIcon />}
      buttonVariant="secondary"
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
        <div className="flex items-center gap-3 rounded-md border px-3 py-2">
          <Checkbox
            id={`requiresSpecialPermission-${workCategory.id}`}
            name="requiresSpecialPermission"
            value="true"
            defaultChecked={Boolean(workCategory.requiresSpecialPermission)}
          />
          <label
            htmlFor={`requiresSpecialPermission-${workCategory.id}`}
            className="text-sm font-medium"
          >
            Requiere permiso especial
          </label>
        </div>
        <div className="flex items-center gap-3 rounded-md border px-3 py-2">
          <Checkbox
            id={`requiresTraining-${workCategory.id}`}
            name="requiresTraining"
            value="true"
            defaultChecked={Boolean(workCategory.requiresTraining)}
          />
          <label htmlFor={`requiresTraining-${workCategory.id}`} className="text-sm font-medium">
            Requiere formación
          </label>
        </div>
      </patchFetcher.Form>
    </AlertDialogContainer>
  );
}
