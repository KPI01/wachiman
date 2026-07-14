import { PlusIcon } from "lucide-react";
import { Form } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type CreateCompanyProps = {
  errors?: unknown;
  actionPath?: string;
};

export default function CreateCompanyForm({
  errors,
  actionPath = "/admin/companies",
}: CreateCompanyProps) {
  return (
    <AlertDialogContainer
      buttonClassName="w-fit ms-auto"
      buttonLabel={
        <>
          <PlusIcon />
          <span className="text-base">Empresa</span>
        </>
      }
      title="Alta de Empresa"
      description="Ingresa los datos de la empresa para almacenarlos en el sistema."
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="create-company">
            Enviar
          </AlertDialogAction>
        </>
      }
    >
      <Form
        id="create-company"
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
          label="Nombre corto"
          htmlFor="slug"
          errors={getFieldErrors(errors, "slug")}
        >
          <Input id="slug" name="slug" className="uppercase" required />
        </FieldWrapper>
        <FieldWrapper
          label="CIF"
          htmlFor="cif"
          errors={getFieldErrors(errors, "cif")}
        >
          <Input id="cif" name="cif" className="uppercase" />
        </FieldWrapper>
        <FieldWrapper
          label="Direccion"
          htmlFor="address"
          errors={getFieldErrors(errors, "address")}
        >
          <Input id="address" name="address" />
        </FieldWrapper>
        <FieldWrapper
          label="Telefono"
          htmlFor="phone"
          errors={getFieldErrors(errors, "phone")}
        >
          <Input id="phone" name="phone" />
        </FieldWrapper>
        <FieldWrapper
          label="Email"
          htmlFor="email"
          errors={getFieldErrors(errors, "email")}
        >
          <Input id="email" name="email" type="email" />
        </FieldWrapper>
      </Form>
    </AlertDialogContainer>
  );
}
