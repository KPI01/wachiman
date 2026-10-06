import { InfoIcon } from "lucide-react";
import { useState } from "react";
import EntityDetailsDialog from "~/components/models/shared/entity-details-dialog";
import DeleteExternalWorkerBtn from "~/components/models/external-worker/delete-external-worker-btn";
import type { Company, WorkCategory } from "../../../../db/schema";
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

export default function ExternalWorkerDetailsForm({
  worker,
  companies,
  workCategories,
  actionPath = "/admin/external-workers",
  open,
  onOpenChange,
  showTrigger = true,
}: ExternalWorkerDetailsProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;
  const formId = `external-worker-form-${worker.id}`;

  return (
    <EntityDetailsDialog
      open={open ?? localOpen}
      onOpenChange={onOpenChange ?? setLocalOpen}
      showTrigger={showTrigger}
      trigger={<InfoIcon aria-hidden="true" />}
      triggerLabel="Abrir ficha del trabajador externo"
      title="Ficha del trabajador externo"
      description={`${[worker.firstName, worker.middleName, worker.lastName, worker.secondLastName].filter(Boolean).join(" ")} · ${worker.legalId}`}
      formId={formId}
      isSubmitting={patchFetcher.state !== "idle"}
      footerLeading={
        <DeleteExternalWorkerBtn
          workerId={worker.id}
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
        <Input name="id" defaultValue={worker.id} type="hidden" />
        <h3 className="text-sm font-semibold md:col-span-2">Datos del trabajador</h3>
        <FieldWrapper
          label="Nombres"
          htmlFor={`firstName-${worker.id}`}
          errors={getFieldErrors(patchErrors, "firstName")}
        >
          <Input
            id={`firstName-${worker.id}`}
            name="firstName"
          defaultValue={[worker.firstName, worker.middleName].filter(Boolean).join(" ")}
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
          defaultValue={[worker.lastName, worker.secondLastName].filter(Boolean).join(" ")}
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
          <Select name="companyId" defaultValue={worker.companyId} disabled={!companies.length}>
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
          label="Tipo de trabajo"
          htmlFor={`workCategoryId-${worker.id}`}
          errors={getFieldErrors(patchErrors, "workCategoryId")}
        >
          <Select name="workCategoryId" defaultValue={worker.workCategoryId} disabled={!workCategories.length}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar tipo de trabajo..." />
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
    </EntityDetailsDialog>
  );
}
