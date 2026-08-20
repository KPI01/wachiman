import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import type { AllowedArea } from "../../../../db/schema";
import { getFieldErrors } from "~/lib/utils/zod-errors";

export default function AllowedAreaDetailsForm({
  allowedArea,
  actionPath = "/admin/allowed-areas",
}: {
  allowedArea: AllowedArea;
  actionPath?: string;
}) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<{ errors?: unknown }>();
  const formId = `allowed-area-form-${allowedArea.id}`;

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={<InfoIcon aria-hidden="true" />}
      buttonVariant="secondary"
      buttonSize="icon-sm"
      buttonAriaLabel="Editar área autorizada"
      buttonTooltip="Editar área autorizada"
      title="Ficha de área autorizada"
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form={formId}>
            Enviar
          </AlertDialogAction>
        </>
      }
    >
      <fetcher.Form id={formId} method="patch" action={actionPath} className="flex flex-col gap-4">
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
    </AlertDialogContainer>
  );
}
