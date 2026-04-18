import { InfoIcon } from "lucide-react";
import { Form, redirect } from "react-router";
import type { Department } from "../../../../generated/prisma/client";
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
import {
  deleteDepartment,
  updateDepartment,
} from "~/lib/database/department";
import {
  deleteDepartmentSchema,
  updateDepartmentSchema,
} from "~/lib/schemas/department";
import type { Route } from "./+types/detail";
import z from "zod";

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

    await updateDepartment(id, dataWithoutId);

    return redirect("/admin/departments");
  }

  if (request.method === "DELETE") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } =
      await deleteDepartmentSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    await deleteDepartment(data.id);

    return redirect("/admin/departments");
  }

  return null;
}

type DepartmentDetailsProps = {
  department: Department;
};

export function DepartmentDetails({ department }: DepartmentDetailsProps) {
  const formId = `department-form-${department.id}`;

  return (
    <AlertDialog>
      <AlertDialogTrigger className={buttonVariants({ variant: "secondary" })}>
        <InfoIcon />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ficha de Departamento</AlertDialogTitle>
        </AlertDialogHeader>
        <Form
          id={formId}
          method="patch"
          action={`/admin/departments/${department.id}`}
          className="space-y-4"
        >
          <Input name="id" defaultValue={department.id} type="hidden" />
          <FieldWrapper label="Nombre" htmlFor={`name-${department.id}`}>
            <Input
              id={`name-${department.id}`}
              name="name"
              defaultValue={department.name}
            />
          </FieldWrapper>
          <FieldWrapper label="Slug" htmlFor={`slug-${department.id}`}>
            <Input
              id={`slug-${department.id}`}
              name="slug"
              defaultValue={department.slug}
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

export default function DepartmentDetailRoute() {
  return null;
}
