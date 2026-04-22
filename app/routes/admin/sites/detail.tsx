import { InfoIcon } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { buttonVariants } from "~/components/ui/button";
import type { Site } from "../../../../generated/prisma/client";
import { useFetcher } from "react-router";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
import type { Route } from "./+types/detail";
import z from "zod";
import { deleteSiteSchema, updateSiteSchema } from "~/lib/schemas/site";
import { SiteEntity } from "~/lib/database/site.server";
import { getFieldErrors } from "~/lib/utils/zod-errors";

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "PATCH") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } = await updateSiteSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    const { id, ...dataWithoutId } = data;

    await SiteEntity.update(id, dataWithoutId);

    return { success: true };
  }

  if (request.method === "DELETE") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } = await deleteSiteSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    await SiteEntity.delete(data.id);

    return { success: true };
  }

  return null;
}

type SiteDetailsProps = {
  site: Site;
};

export function SiteDetails({ site }: SiteDetailsProps) {
  const [open, setOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;

  const formId = `site-form-${site.id}`;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className={buttonVariants({ variant: "secondary" })}>
        <InfoIcon />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ficha de Centro</AlertDialogTitle>
        </AlertDialogHeader>
        <patchFetcher.Form
          id={formId}
          method="patch"
          action={`/admin/sites/${site.id}`}
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
        <AlertDialogFooter>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form={formId}>
            Enviar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function SiteDetailRoute() {
  return null;
}
