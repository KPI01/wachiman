import { PlusIcon } from "lucide-react";
import { Form } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getFieldErrors } from "~/lib/utils/zod-errors";

export default function CreateAllowedAreaForm({
  errors,
  actionPath = "/admin/allowed-areas",
}: {
  errors?: unknown;
  actionPath?: string;
}) {
  return (
    <AlertDialogContainer
      buttonClassName="w-fit ms-auto"
      buttonLabel={
        <>
          <PlusIcon />
          <span className="text-base">Área</span>
        </>
      }
      title="Alta de área autorizada"
      description="Ingresa el nombre del área autorizada."
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="create-allowed-area">
            Enviar
          </AlertDialogAction>
        </>
      }
    >
      <Form
        id="create-allowed-area"
        method="post"
        action={actionPath}
        className="flex flex-col gap-4"
      >
        <FieldWrapper label="Nombre" htmlFor="name" errors={getFieldErrors(errors, "name")}>
          <Input id="name" name="name" required />
        </FieldWrapper>
      </Form>
    </AlertDialogContainer>
  );
}
