import { PlusIcon } from "lucide-react";
import { Form } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getFieldErrors } from "~/lib/utils/zod-errors";
import type { Company, WorkCategory } from "../../../../prisma/generated/prisma/client";

type CreateExternalWorkerProps = {
  errors?: unknown;
  companies: Company[];
  workCategories: WorkCategory[];
  actionPath?: string;
};

export default function CreateExternalWorkerForm({
  errors,
  companies,
  workCategories,
  actionPath = "/admin/external-workers",
}: CreateExternalWorkerProps) {
  return (
    <AlertDialogContainer
      buttonClassName="w-fit ms-auto"
      buttonLabel={
        <>
          <PlusIcon />
          <span className="text-base">Trabajador</span>
        </>
      }
      title="Alta de Trabajador Externo"
      description="Ingresa los datos del trabajador externo. Los campos con (*) son obligatorios."
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="create-external-worker">
            Enviar
          </AlertDialogAction>
        </>
      }
    >
      <Form
        id="create-external-worker"
        method="post"
        action={actionPath}
        className="grid gap-4 md:grid-cols-2"
      >
        <FieldWrapper
          label="Nombre *"
          htmlFor="firstName"
          errors={getFieldErrors(errors, "firstName")}
        >
          <Input id="firstName" name="firstName" required />
        </FieldWrapper>
        <FieldWrapper
          label="Apellidos *"
          htmlFor="lastName"
          errors={getFieldErrors(errors, "lastName")}
        >
          <Input id="lastName" name="lastName" required />
        </FieldWrapper>
        <FieldWrapper
          label="Segundo nombre"
          htmlFor="middleName"
          errors={getFieldErrors(errors, "middleName")}
        >
          <Input id="middleName" name="middleName" />
        </FieldWrapper>
        <FieldWrapper
          label="Segundo apellido"
          htmlFor="secondLastName"
          errors={getFieldErrors(errors, "secondLastName")}
        >
          <Input id="secondLastName" name="secondLastName" />
        </FieldWrapper>
        <FieldWrapper
          label="DNI/NIE *"
          htmlFor="legalId"
          errors={getFieldErrors(errors, "legalId")}
        >
          <Input id="legalId" name="legalId" className="uppercase" required />
        </FieldWrapper>
        <FieldWrapper
          label="Telefono"
          htmlFor="phoneNumber"
          errors={getFieldErrors(errors, "phoneNumber")}
        >
          <Input id="phoneNumber" name="phoneNumber" />
        </FieldWrapper>
        <FieldWrapper
          label="Empresa *"
          htmlFor="companyId"
          errors={getFieldErrors(errors, "companyId")}
        >
          <Select name="companyId" required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar empresa..." />
            </SelectTrigger>
            <SelectContent position="popper">
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>
        <FieldWrapper
          label="Categoria laboral *"
          htmlFor="workCategoryId"
          errors={getFieldErrors(errors, "workCategoryId")}
        >
          <Select name="workCategoryId" required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar categoria..." />
            </SelectTrigger>
            <SelectContent position="popper">
              {workCategories.map((wc) => (
                <SelectItem key={wc.id} value={wc.id}>
                  {wc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>
      </Form>
    </AlertDialogContainer>
  );
}
