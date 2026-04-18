import { InfoIcon } from "lucide-react";
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
import { Form, redirect } from "react-router";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
import type { Route } from "./+types/detail";
import z from "zod";
import { deleteSiteSchema, updateSiteSchema } from "~/lib/schemas/site";
import { deleteSite, updateSite } from "~/lib/database/site";

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "PATCH") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } = await updateSiteSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    const { id, ...dataWithoutId } = data;

    await updateSite(id, dataWithoutId);

    return redirect("/admin/sites");
  }

  if (request.method === "DELETE") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } = await deleteSiteSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    await deleteSite(data.id);

    return redirect("/admin/sites");
  }

  return null;
}

type SiteDetailsProps = {
  site: Site;
};

export function SiteDetails({ site }: SiteDetailsProps) {
  const formId = `site-form-${site.id}`;

  return (
    <AlertDialog>
      <AlertDialogTrigger className={buttonVariants({ variant: "secondary" })}>
        <InfoIcon />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ficha de Centro</AlertDialogTitle>
        </AlertDialogHeader>
        <Form
          id={formId}
          method="patch"
          action={`/admin/sites/${site.id}`}
          className="space-y-4"
        >
          <Input name="id" defaultValue={site.id} type="hidden" />
          <FieldWrapper label="Nombre" htmlFor={`name-${site.id}`}>
            <Input id={`name-${site.id}`} name="name" defaultValue={site.name} />
          </FieldWrapper>
          <FieldWrapper label="Slug" htmlFor={`slug-${site.id}`}>
            <Input id={`slug-${site.id}`} name="slug" defaultValue={site.slug} />
          </FieldWrapper>
          <FieldWrapper label="Direccion" htmlFor={`address-${site.id}`}>
            <Input
              id={`address-${site.id}`}
              name="address"
              defaultValue={site.address ?? ""}
            />
          </FieldWrapper>
        </Form>
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
