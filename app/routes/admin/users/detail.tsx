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
import type {
  Department,
  Site,
  User,
  UserRole,
} from "../../../../prisma/generated/prisma/client";
import { useFetcher } from "react-router";
import { Checkbox } from "~/components/ui/checkbox";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Route } from "./+types/detail";
import { trashUserSchema, updateUserSchema } from "~/lib/schemas/user";
import z from "zod";
import { UserEntity } from "~/lib/database/user.server";
import { USER_ROLES } from "~/lib/models/user";
import { getFieldErrors } from "~/lib/utils/zod-errors";

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "PATCH") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } =
      await updateUserSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    const { id, ...dataWithoutId } = data;

    await UserEntity.update(id, dataWithoutId);

    return { success: true };
  }

  if (request.method === "DELETE") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } =
      await trashUserSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    await UserEntity.trash(data.id);

    return { success: true };
  }

  return null;
}

type UserDetailsProps = {
  user: User;
  sites: Site[];
  departments: Department[];
};

export function UserDetails({ user, sites, departments }: UserDetailsProps) {
  const [open, setOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const deleteFetcher = useFetcher<{ errors?: unknown }>();

  const patchErrors = patchFetcher.data?.errors;
  const deleteErrors = deleteFetcher.data?.errors;

  const formId = `user-form-${user.id}`;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className={buttonVariants({ variant: "secondary" })}>
        <InfoIcon />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ficha de Usuario</AlertDialogTitle>
        </AlertDialogHeader>
        <patchFetcher.Form
          id={formId}
          method="patch"
          action={`/admin/users/${user.id}`}
          className="space-y-4"
          onSubmit={() => {
            // El cierre en éxito se maneja vía useEffect si fuera necesario,
            // pero con fetcher podemos revisar cuando fetcher.state pasa a idle
          }}
        >
          <Input name="id" defaultValue={user.id} type="hidden" />
          <FieldWrapper
            label="Nombre completo"
            htmlFor="fullName"
            errors={getFieldErrors(patchErrors, "fullName")}
          >
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              defaultValue={user.fullName}
            />
          </FieldWrapper>
          <FieldWrapper
            label="Nombre de inicio de sesión"
            htmlFor="username"
            errors={getFieldErrors(patchErrors, "username")}
          >
            <Input
              id="username"
              name="username"
              autoComplete="username"
              defaultValue={user.username}
            />
          </FieldWrapper>
          <FieldWrapper
            label="Centro"
            htmlFor="siteId"
            errors={getFieldErrors(patchErrors, "siteId")}
          >
            <Select name="siteId" defaultValue={user.siteId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Centro para el usuario..." />
              </SelectTrigger>
              <SelectContent position="popper">
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrapper>
          <FieldWrapper
            label="Departamento"
            htmlFor="departmentId"
            errors={getFieldErrors(patchErrors, "departmentId")}
          >
            <Select name="departmentId" defaultValue={user.departmentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Departamento para el usuario..." />
              </SelectTrigger>
              <SelectContent position="popper">
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrapper>
          <FieldWrapper
            label="Rol de usuario"
            htmlFor="role"
            errors={getFieldErrors(patchErrors, "role")}
          >
            <Select name="role" defaultValue={user.role as string}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Rol para el usuario..." />
              </SelectTrigger>
              <SelectContent position="popper">
                {(Object.keys(USER_ROLES) as UserRole[]).map((role, ix) => (
                  <SelectItem key={ix} value={role}>
                    {USER_ROLES[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrapper>
          <FieldWrapper
            orientation="horizontal"
            label="Usuario activo"
            htmlFor={`isActive-${user.id}`}
            errors={getFieldErrors(patchErrors, "isActive")}
          >
            <Checkbox
              id={`isActive-${user.id}`}
              name="isActive"
              defaultChecked={Boolean(user.isActive)}
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

export default function UserDetailRoute() {
  return null;
}
