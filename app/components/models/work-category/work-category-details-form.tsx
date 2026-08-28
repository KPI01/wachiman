import { InfoIcon } from "lucide-react";
import { useState } from "react";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
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
};

export default function WorkCategoryDetailsForm({
  workCategory,
  actionPath = "/admin/work-categories",
}: WorkCategoryDetailsProps) {
  const { workPermitsEnabled } = useAppConfig();

  const [open, setOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;
  const formId = `work-category-form-${workCategory.id}`;

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={<InfoIcon aria-hidden="true" />}
      buttonVariant="secondary"
      buttonSize="icon-sm"
      buttonAriaLabel="Editar tipo de trabajo"
      buttonTooltip="Editar tipo de trabajo"
      title="Ficha de tipo de trabajo"
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
    </AlertDialogContainer>
  );
}
