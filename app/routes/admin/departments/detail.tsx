import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import type { Department } from "../../../../prisma/generated/prisma/client";
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
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { DepartmentEntity } from "~/lib/database/department.server";
import {
  deleteDepartmentSchema,
  updateDepartmentSchema,
} from "~/lib/schemas/department";
import type { Route } from "./+types/detail";
import z from "zod";
import { getFieldErrors } from "~/lib/utils/zod-errors";

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "PATCH") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } =
      await updateDepartmentSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    const { id, ...dataWithoutId } = data;

    await DepartmentEntity.update(id, dataWithoutId);

    return { success: true };
  }

  if (request.method === "DELETE") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } =
      await deleteDepartmentSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    await DepartmentEntity.delete(data.id);

    return { success: true };
  }

  return null;
}

type DepartmentDetailsProps = {
  department: Department;
};

export function DepartmentDetails({ department }: DepartmentDetailsProps) {
  const [open, setOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;

  const formId = `department-form-${department.id}`;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className={buttonVariants({ variant: "secondary" })}>
        <InfoIcon />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ficha de Departamento</AlertDialogTitle>
        </AlertDialogHeader>
        <patchFetcher.Form
          id={formId}
          method="patch"
          action={`/admin/departments/${department.id}`}
          className="space-y-4"
        >
          <Input name="id" defaultValue={department.id} type="hidden" />
          <FieldWrapper
            label="Nombre"
            htmlFor={`name-${department.id}`}
            errors={getFieldErrors(patchErrors, "name")}
          >
            <Input
              id={`name-${department.id}`}
              name="name"
              defaultValue={department.name}
            />
          </FieldWrapper>
          <FieldWrapper
            label="Slug"
            htmlFor={`slug-${department.id}`}
            errors={getFieldErrors(patchErrors, "slug")}
          >
            <Input
              id={`slug-${department.id}`}
              name="slug"
              defaultValue={department.slug}
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

export default function DepartmentDetailRoute() {
  return null;
}
