import { PlusIcon } from "lucide-react";
import { Form } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Input } from "~/components/ui/input";
// Comentado: los requisitos documentales ya no se muestran.
// import { Checkbox } from "~/components/ui/checkbox";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getFieldErrors } from "~/lib/utils/zod-errors";
// import { Field, FieldDescription, FieldLegend, FieldSet } from "~/components/ui/field";

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
{/* Comentado: los requisitos documentales ya no se muestran. */}
        {/* <FieldSet> */}
        {/*   <FieldLegend>Requisitos documentales</FieldLegend> */}
        {/*   <FieldDescription> */}
        {/*     Activa los tipos de documento que deben estar validados antes de autorizar el acceso. */}
        {/*   </FieldDescription> */}
        {/*   <Field orientation="horizontal"> */}
        {/*     <Checkbox id="requiresTraining" name="requiresTraining" value="true" /> */}
        {/*     <label htmlFor="requiresTraining" className="text-sm font-medium"> */}
        {/*       Exigir documento de formación */}
        {/*     </label> */}
        {/*   </Field> */}
        {/*   <Field orientation="horizontal"> */}
        {/*     <Checkbox id="requiresSpecialPermission" name="requiresSpecialPermission" value="true" /> */}
        {/*     <label htmlFor="requiresSpecialPermission" className="text-sm font-medium"> */}
        {/*       Exigir autorización o permiso especial */}
        {/*     </label> */}
        {/*   </Field> */}
        {/* </FieldSet> */}
      </Form>
    </AlertDialogContainer>
  );
}
