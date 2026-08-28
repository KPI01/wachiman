import { PlusIcon } from "lucide-react";
import { Form } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getFieldErrors } from "~/lib/utils/zod-errors";
import { useAppConfig } from "~/lib/app-config";

type CreateWorkCategoryProps = {
  errors?: unknown;
  actionPath?: string;
};

export default function CreateWorkCategoryForm({
  errors,
  actionPath = "/admin/work-categories",
}: CreateWorkCategoryProps) {
  const { workPermitsEnabled } = useAppConfig();

  return (
    <AlertDialogContainer
      buttonClassName="w-fit ms-auto"
      buttonLabel={
        <>
          <PlusIcon />
          <span className="text-base">Tipo de trabajo</span>
        </>
      }
      title="Alta de tipo de trabajo"
      description="Ingresa los datos del tipo de trabajo."
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
        <FieldWrapper
          label="Riesgos e instrucciones preventivas"
          htmlFor="riskInformation"
          errors={getFieldErrors(errors, "riskInformation")}
        >
          <Textarea
            id="riskInformation"
            name="riskInformation"
            placeholder="Describe los riesgos y las medidas preventivas propias de este tipo de trabajo."
          />
        </FieldWrapper>
        {workPermitsEnabled ? (
          <label className="flex items-center gap-3 text-sm font-medium">
            <Checkbox id="requiresWorkPermit" name="requiresWorkPermit" value="true" />
            Exigir permiso de trabajo para este tipo de trabajo
          </label>
        ) : null}
      </Form>
    </AlertDialogContainer>
  );
}
