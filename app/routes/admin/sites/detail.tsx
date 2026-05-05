import { InfoIcon } from "lucide-react";
import { useState } from "react";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import type { Site } from "../../../../prisma/generated/prisma/client";
import { useFetcher } from "react-router";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type SiteDetailsProps = {
  site: Site;
};

export function SiteDetails({ site }: SiteDetailsProps) {
  const [open, setOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;

  const formId = `site-form-${site.id}`;

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={setOpen}
      buttonLabel={<InfoIcon />}
      buttonVariant="secondary"
      title="Ficha de Centro"
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
        action={`/admin/sites?id=${site.id}`}
        className="space-y-4"
      >
        <Input name="id" defaultValue={site.id} type="hidden" />
        <FieldWrapper
          label="Nombre"
          htmlFor={`name-${site.id}`}
          errors={getFieldErrors(patchErrors, "name")}
        >
          <Input id={`name-${site.id}`} name="name" defaultValue={site.name} />
        </FieldWrapper>
        <FieldWrapper
          label="Slug"
          htmlFor={`slug-${site.id}`}
          errors={getFieldErrors(patchErrors, "slug")}
        >
          <Input id={`slug-${site.id}`} name="slug" defaultValue={site.slug} />
        </FieldWrapper>
        <FieldWrapper
          label="Direccion"
          htmlFor={`address-${site.id}`}
          errors={getFieldErrors(patchErrors, "address")}
        >
          <Input
            id={`address-${site.id}`}
            name="address"
            defaultValue={site.address ?? ""}
          />
        </FieldWrapper>
      </patchFetcher.Form>
    </AlertDialogContainer>
  );
}

export default function SiteDetailRoute() {
  return null;
}
