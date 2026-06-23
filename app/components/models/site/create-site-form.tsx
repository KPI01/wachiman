import { PlusIcon } from "lucide-react";
import { Form } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type CreateSiteProps = {
  errors?: unknown;
};

export default function CreateSiteForm({ errors }: CreateSiteProps) {
  return (
    <AlertDialogContainer
      buttonClassName="w-fit ms-auto"
      buttonLabel={
        <>
          <PlusIcon />
          <span className="text-base">Centro</span>
        </>
      }
      title="Alta de Centro"
      description="Ingresa los datos del centro para almacenarlos en el sistema."
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="create-site">
            Enviar
          </AlertDialogAction>
        </>
      }
    >
      <Form
        id="create-site"
        method="post"
        action="/admin/sites"
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
          label="Nombre corto"
          htmlFor="slug"
          errors={getFieldErrors(errors, "slug")}
        >
          <Input id="slug" name="slug" className="uppercase" required />
        </FieldWrapper>
        <FieldWrapper
          label="Direccion"
          htmlFor="address"
          errors={getFieldErrors(errors, "address")}
        >
          <Input id="address" name="address" />
        </FieldWrapper>
      </Form>
    </AlertDialogContainer>
  );
}
