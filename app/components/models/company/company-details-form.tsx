import { InfoIcon } from "lucide-react";
import { useState } from "react";
import EntityDetailsDialog from "~/components/models/shared/entity-details-dialog";
import DeleteCompanyBtn from "~/components/models/company/delete-company-btn";
import type { Company } from "../../../../db/schema";
import { useFetcher } from "react-router";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type CompanyDetailsProps = {
  company: Company;
  actionPath?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

export default function CompanyDetailsForm({
  company,
  actionPath = "/admin/companies",
  open,
  onOpenChange,
  showTrigger = true,
}: CompanyDetailsProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;
  const formId = `company-form-${company.id}`;

  return (
    <EntityDetailsDialog
      open={open ?? localOpen}
      onOpenChange={onOpenChange ?? setLocalOpen}
      showTrigger={showTrigger}
      trigger={<InfoIcon aria-hidden="true" />}
      triggerLabel="Abrir ficha de la empresa"
      title="Ficha de la empresa"
      description={company.name}
      formId={formId}
      isSubmitting={patchFetcher.state !== "idle"}
      footerLeading={
        <DeleteCompanyBtn
          companyId={company.id}
          actionPath={actionPath}
          onDeleted={() => {
            setLocalOpen(false);
            onOpenChange?.(false);
          }}
        />
      }
    >
      <patchFetcher.Form
        id={formId}
        method="patch"
        action={actionPath}
        className="grid gap-4 md:grid-cols-2"
      >
        <h3 className="text-sm font-semibold md:col-span-2">Datos de la empresa</h3>
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
    </EntityDetailsDialog>
  );
}
