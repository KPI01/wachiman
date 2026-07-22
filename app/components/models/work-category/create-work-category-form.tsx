import { PlusIcon } from "lucide-react";
import { Form } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type CreateWorkCategoryProps = {
  errors?: unknown;
  actionPath?: string;
};

export default function CreateWorkCategoryForm({
  errors,
  actionPath = "/admin/work-categories",
}: CreateWorkCategoryProps) {
  return (
    <AlertDialogContainer
      buttonClassName="w-fit ms-auto"
      buttonLabel={
        <>
          <PlusIcon />
          <span className="text-base">Categoria</span>
        </>
      }
      title="Alta de Categoria Laboral"
      description="Ingresa los datos de la categoria laboral."
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="create-work-category">
            Enviar
          </AlertDialogAction>
        </>
      }
    >
      <Form
        id="create-work-category"
        method="post"
        action={actionPath}
        className="space-y-4"
      >
        <FieldWrapper
          label="Nombre"
          htmlFor="name"
          errors={getFieldErrors(errors, "name")}
        >
          <Input id="name" name="name" required />
        </FieldWrapper>
        <FieldWrapper
          label="Descripcion"
          htmlFor="description"
          errors={getFieldErrors(errors, "description")}
        >
          <Input id="description" name="description" />
        </FieldWrapper>
        <div className="flex items-center gap-3 rounded-md border px-3 py-2">
          <Checkbox
            id="requiresSpecialPermission"
            name="requiresSpecialPermission"
            value="true"
          />
          <label
            htmlFor="requiresSpecialPermission"
            className="text-sm font-medium"
          >
            Requiere permiso especial
          </label>
        </div>
        <div className="flex items-center gap-3 rounded-md border px-3 py-2">
          <Checkbox id="requiresTraining" name="requiresTraining" value="true" />
          <label htmlFor="requiresTraining" className="text-sm font-medium">
            Requiere formación
          </label>
        </div>
      </Form>
    </AlertDialogContainer>
  );
}
