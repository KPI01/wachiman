import { useState } from "react";
import { useFetcher } from "react-router";
import CompanyCombobox from "~/components/models/company/company-combobox";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { FieldGroup } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getActionErrorMessage } from "~/lib/utils/action-errors";
import { getFieldErrors } from "~/lib/utils/zod-errors";

export default function ValidatePlannedAccessCompanyForm({ companyName, updatedAt, actionPath }: {
  companyName: string;
  updatedAt: Date;
  actionPath: string;
}) {
  const fetcher = useFetcher<{ success?: boolean; errors?: unknown }>();
  const [mode, setMode] = useState("existing");
  const [existingName, setExistingName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const fields = [
    { name: "name", label: "Nombre de la empresa *", required: true, defaultValue: companyName },
    { name: "slug", label: "Código de empresa *", required: true },
    { name: "cif", label: "CIF" },
    { name: "address", label: "Dirección" },
    { name: "phone", label: "Teléfono" },
    { name: "email", label: "Correo electrónico", type: "email" },
  ];
  return (
    <fetcher.Form method="post" action={actionPath} className="flex flex-col gap-4">
      <input type="hidden" name="intent" value="validate-company" />
      <input type="hidden" name="expectedUpdatedAt" value={new Date(updatedAt).toISOString()} />
      <Alert>
        <AlertTitle>Empresa pendiente de validar</AlertTitle>
        <AlertDescription>
          Empresa indicada: «{companyName}». Asocia una empresa existente o registra la nueva.
        </AlertDescription>
      </Alert>
      {fetcher.data?.errors ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo validar la empresa</AlertTitle>
          <AlertDescription>{getActionErrorMessage(fetcher.data.errors)}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FieldWrapper className="md:col-span-2 xl:col-span-3" label="Validación de empresa" htmlFor="company-validation-mode">
          <Select name="mode" value={mode} onValueChange={setMode}>
            <SelectTrigger id="company-validation-mode"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>
              <SelectItem value="existing">Asociar una empresa existente</SelectItem>
              <SelectItem value="new">Registrar y validar una empresa nueva</SelectItem>
            </SelectGroup></SelectContent>
          </Select>
        </FieldWrapper>
        {mode === "existing" ? (
          <FieldWrapper className="md:col-span-2 xl:col-span-3" label="Empresa existente *" htmlFor="validated-company">
            <CompanyCombobox id="validated-company" name="existingCompanyName" required requireSelection
              placeholder="Busca y selecciona la empresa correcta..."
              value={existingName} onValueChange={setExistingName}
              onCompanyIdChange={(id) => setCompanyId(id ?? "")} />
            <input type="hidden" name="companyId" value={companyId} />
          </FieldWrapper>
        ) : fields.map((field) => (
          <FieldWrapper key={field.name} className={field.name === "name" || field.name === "address" ? "md:col-span-2" : undefined} label={field.label} htmlFor={`validate-company-${field.name}`}
            errors={getFieldErrors(fetcher.data?.errors, field.name)}>
            <Input id={`validate-company-${field.name}`} name={field.name} required={field.required}
              defaultValue={field.defaultValue} type={field.type ?? "text"}
              placeholder={field.name === "slug" ? "Ej.: CONSTRUCCIONES-MURCIANAS" : undefined}
              aria-invalid={Boolean(getFieldErrors(fetcher.data?.errors, field.name)?.length)} />
          </FieldWrapper>
        ))}
      </FieldGroup>
      <Button type="submit" className="w-fit" disabled={fetcher.state !== "idle"}>
        {fetcher.state !== "idle" ? "Validando empresa..." : "Validar y asociar empresa"}
      </Button>
    </fetcher.Form>
  );
}
