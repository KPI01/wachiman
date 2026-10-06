import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import EntityDetailsDialog from "~/components/models/shared/entity-details-dialog";
import DeleteAllowedAreaBtn from "~/components/models/allowed-area/delete-allowed-area-btn";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import type { AllowedArea } from "../../../../db/schema";
import { getFieldErrors } from "~/lib/utils/zod-errors";

export default function AllowedAreaDetailsForm({
  allowedArea,
  actionPath = "/admin/allowed-areas",
  open,
  onOpenChange,
  showTrigger = true,
}: {
  allowedArea: AllowedArea;
  actionPath?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const fetcher = useFetcher<{ errors?: unknown }>();
  const formId = `allowed-area-form-${allowedArea.id}`;

  return (
    <EntityDetailsDialog
      open={open ?? localOpen}
      onOpenChange={onOpenChange ?? setLocalOpen}
      showTrigger={showTrigger}
      trigger={<InfoIcon aria-hidden="true" />}
      triggerLabel="Abrir ficha del área autorizada"
      title="Ficha del área autorizada"
      description={allowedArea.name}
      formId={formId}
      isSubmitting={fetcher.state !== "idle"}
      footerLeading={
        <DeleteAllowedAreaBtn
          allowedAreaId={allowedArea.id}
          actionPath={actionPath}
          onDeleted={() => {
            setLocalOpen(false);
            onOpenChange?.(false);
          }}
        />
      }
    >
      <fetcher.Form id={formId} method="patch" action={actionPath} className="grid gap-4 md:grid-cols-2">
        <h3 className="text-sm font-semibold md:col-span-2">Área autorizada</h3>
        <Input name="id" defaultValue={allowedArea.id} type="hidden" />
        <FieldWrapper
          label="Nombre"
          htmlFor={`allowed-area-name-${allowedArea.id}`}
          errors={getFieldErrors(fetcher.data?.errors, "name")}
        >
          <Input
            id={`allowed-area-name-${allowedArea.id}`}
            name="name"
            defaultValue={allowedArea.name}
            required
          />
        </FieldWrapper>
      </fetcher.Form>
    </EntityDetailsDialog>
  );
}
