import { InfoIcon } from "lucide-react";
import { useState } from "react";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import type {
  Company,
  WorkCategory,
} from "../../../../prisma/generated/prisma/client";
import type { ExternalWorkerListItem } from "~/lib/database/external-worker.server";
import { useFetcher } from "react-router";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type ExternalWorkerDetailsProps = {
  worker: ExternalWorkerListItem;
  companies: Company[];
  workCategories: WorkCategory[];
  actionPath?: string;
};

export default function ExternalWorkerDetailsForm({
  worker,
  companies,
  workCategories,
  actionPath = "/admin/external-workers",
}: ExternalWorkerDetailsProps) {
  const [open, setOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;
  const formId = `external-worker-form-${worker.id}`;

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={<InfoIcon />}
      buttonVariant="secondary"
      title="Ficha de Trabajador Externo"
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
        className="grid gap-4 md:grid-cols-2"
      >
        <Input name="id" defaultValue={worker.id} type="hidden" />
        <FieldWrapper
          label="Nombre"
          htmlFor={`firstName-${worker.id}`}
          errors={getFieldErrors(patchErrors, "firstName")}
        >
          <Input
            id={`firstName-${worker.id}`}
            name="firstName"
            defaultValue={worker.firstName}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Apellidos"
          htmlFor={`lastName-${worker.id}`}
          errors={getFieldErrors(patchErrors, "lastName")}
        >
          <Input
            id={`lastName-${worker.id}`}
            name="lastName"
            defaultValue={worker.lastName}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Segundo nombre"
          htmlFor={`middleName-${worker.id}`}
          errors={getFieldErrors(patchErrors, "middleName")}
        >
          <Input
            id={`middleName-${worker.id}`}
            name="middleName"
            defaultValue={worker.middleName ?? ""}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Segundo apellido"
          htmlFor={`secondLastName-${worker.id}`}
          errors={getFieldErrors(patchErrors, "secondLastName")}
        >
          <Input
            id={`secondLastName-${worker.id}`}
            name="secondLastName"
            defaultValue={worker.secondLastName ?? ""}
          />
        </FieldWrapper>
        <FieldWrapper
          label="DNI/NIE"
          htmlFor={`legalId-${worker.id}`}
          errors={getFieldErrors(patchErrors, "legalId")}
        >
          <Input
            id={`legalId-${worker.id}`}
            name="legalId"
            className="uppercase"
            defaultValue={worker.legalId}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Telefono"
          htmlFor={`phoneNumber-${worker.id}`}
          errors={getFieldErrors(patchErrors, "phoneNumber")}
        >
          <Input
            id={`phoneNumber-${worker.id}`}
            name="phoneNumber"
            defaultValue={worker.phoneNumber ?? ""}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Empresa"
          htmlFor={`companyId-${worker.id}`}
          errors={getFieldErrors(patchErrors, "companyId")}
        >
          <Select name="companyId" defaultValue={worker.companyId}>
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
          label="Categoria laboral"
          htmlFor={`workCategoryId-${worker.id}`}
          errors={getFieldErrors(patchErrors, "workCategoryId")}
        >
          <Select name="workCategoryId" defaultValue={worker.workCategoryId}>
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
      </patchFetcher.Form>
    </AlertDialogContainer>
  );
}
