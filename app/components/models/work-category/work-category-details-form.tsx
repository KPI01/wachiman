import { InfoIcon } from "lucide-react";
import { useState } from "react";
import EntityDetailsDialog from "~/components/models/shared/entity-details-dialog";
import DeleteWorkCategoryBtn from "~/components/models/work-category/delete-work-category-btn";
import type { WorkCategory } from "../../../../db/schema";
import { useFetcher } from "react-router";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { getFieldErrors } from "~/lib/utils/zod-errors";
import { useAppConfig } from "~/lib/app-config";

type WorkCategoryDetailsProps = {
  workCategory: WorkCategory;
  actionPath?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

export default function WorkCategoryDetailsForm({
  workCategory,
  actionPath = "/admin/work-categories",
  open,
  onOpenChange,
  showTrigger = true,
}: WorkCategoryDetailsProps) {
  const { workPermitsEnabled } = useAppConfig();

  const [localOpen, setLocalOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;
  const formId = `work-category-form-${workCategory.id}`;

  return (
    <EntityDetailsDialog
      open={open ?? localOpen}
      onOpenChange={onOpenChange ?? setLocalOpen}
      showTrigger={showTrigger}
      trigger={<InfoIcon aria-hidden="true" />}
      triggerLabel="Abrir ficha del tipo de trabajo"
      title="Ficha del tipo de trabajo"
      description={workCategory.name}
      formId={formId}
      isSubmitting={patchFetcher.state !== "idle"}
      footerLeading={
        <DeleteWorkCategoryBtn
          workCategoryId={workCategory.id}
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
        <h3 className="text-sm font-semibold md:col-span-2">Datos del tipo de trabajo</h3>
        <Input name="id" defaultValue={workCategory.id} type="hidden" />
        <FieldWrapper
          label="Nombre"
          htmlFor={`name-${workCategory.id}`}
          errors={getFieldErrors(patchErrors, "name")}
        >
          <Input
            id={`name-${workCategory.id}`}
            name="name"
            defaultValue={workCategory.name}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Descripcion"
          htmlFor={`description-${workCategory.id}`}
          errors={getFieldErrors(patchErrors, "description")}
        >
          <Input
            id={`description-${workCategory.id}`}
            name="description"
            defaultValue={workCategory.description ?? ""}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Riesgos e instrucciones preventivas"
          htmlFor={`riskInformation-${workCategory.id}`}
          errors={getFieldErrors(patchErrors, "riskInformation")}
        >
          <Textarea
            id={`riskInformation-${workCategory.id}`}
            name="riskInformation"
            defaultValue={workCategory.riskInformation ?? ""}
            placeholder="Describe los riesgos y las medidas preventivas propias de este tipo de trabajo."
          />
        </FieldWrapper>
        {workPermitsEnabled ? (
          <label className="flex items-center gap-3 text-sm font-medium">
            <Checkbox
              id={`requiresWorkPermit-${workCategory.id}`}
              name="requiresWorkPermit"
              value="true"
              defaultChecked={Boolean(workCategory.requiresWorkPermit)}
            />
            Exigir permiso de trabajo para este tipo de trabajo
          </label>
        ) : null}
      </patchFetcher.Form>
    </EntityDetailsDialog>
  );
}
