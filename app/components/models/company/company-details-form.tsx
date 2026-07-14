import { InfoIcon } from "lucide-react";
import { useState } from "react";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import type { Company } from "../../../../prisma/generated/prisma/client";
import { useFetcher } from "react-router";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type CompanyDetailsProps = {
  company: Company;
  actionPath?: string;
};

export default function CompanyDetailsForm({
  company,
  actionPath = "/admin/companies",
}: CompanyDetailsProps) {
  const [open, setOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;
  const formId = `company-form-${company.id}`;

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={<InfoIcon />}
      buttonVariant="secondary"
      title="Ficha de Empresa"
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
        <Input name="id" defaultValue={company.id} type="hidden" />
        <FieldWrapper
          label="Nombre"
          htmlFor={`name-${company.id}`}
          errors={getFieldErrors(patchErrors, "name")}
        >
          <Input
            id={`name-${company.id}`}
            name="name"
            defaultValue={company.name}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Nombre corto"
          htmlFor={`slug-${company.id}`}
          errors={getFieldErrors(patchErrors, "slug")}
        >
          <Input
            id={`slug-${company.id}`}
            name="slug"
            defaultValue={company.slug}
          />
        </FieldWrapper>
        <FieldWrapper
          label="CIF"
          htmlFor={`cif-${company.id}`}
          errors={getFieldErrors(patchErrors, "cif")}
        >
          <Input
            id={`cif-${company.id}`}
            name="cif"
            className="uppercase"
            defaultValue={company.cif ?? ""}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Direccion"
          htmlFor={`address-${company.id}`}
          errors={getFieldErrors(patchErrors, "address")}
        >
          <Input
            id={`address-${company.id}`}
            name="address"
            defaultValue={company.address ?? ""}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Telefono"
          htmlFor={`phone-${company.id}`}
          errors={getFieldErrors(patchErrors, "phone")}
        >
          <Input
            id={`phone-${company.id}`}
            name="phone"
            defaultValue={company.phone ?? ""}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Email"
          htmlFor={`email-${company.id}`}
          errors={getFieldErrors(patchErrors, "email")}
        >
          <Input
            id={`email-${company.id}`}
            name="email"
            type="email"
            defaultValue={company.email ?? ""}
          />
        </FieldWrapper>
      </patchFetcher.Form>
    </AlertDialogContainer>
  );
}
