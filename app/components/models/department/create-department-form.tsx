import { PlusIcon } from "lucide-react";
import { Form } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type CreateDepartmentProps = {
  errors?: unknown;
};

export default function CreateDepartmentForm({
  errors,
}: CreateDepartmentProps) {
  return (
    <AlertDialogContainer
      buttonClassName="w-fit ms-auto"
      buttonLabel={
        <>
          <PlusIcon />
          Departamento
        </>
      }
      title="Alta de Departamento"
      description="Ingresa los datos del departamento para almacenarlos en el sistema."
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="create-department">
            Enviar
          </AlertDialogAction>
        </>
      }
    >
      <Form
        id="create-department"
        method="post"
        action="/admin/departments"
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
          label="Slug"
          htmlFor="slug"
          errors={getFieldErrors(errors, "slug")}
        >
          <Input id="slug" name="slug" className="uppercase" required />
        </FieldWrapper>
      </Form>
    </AlertDialogContainer>
  );
}
