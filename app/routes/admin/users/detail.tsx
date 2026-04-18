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
import type {
  Department,
  Site,
  User,
  UserRole,
} from "../../../../generated/prisma/client";
import { Form, redirect } from "react-router";
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
import { trashUser, updateUser } from "~/lib/database/user";
import { USER_ROLES } from "~/lib/models/user";

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

    await updateUser(id, dataWithoutId);

    return redirect("/admin/users");
  }

  if (request.method === "DELETE") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } =
      await trashUserSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    await trashUser(data.id);

    return redirect("/admin/users");
  }

  return null;
}

type UserDetailsProps = {
  user: User;
  sites: Site[];
  departments: Department[];
};

export function UserDetails({ user, sites, departments }: UserDetailsProps) {
  const formId = `user-form-${user.id}`;

  return (
    <AlertDialog>
      <AlertDialogTrigger className={buttonVariants({ variant: "secondary" })}>
        <InfoIcon />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ficha de Usuario</AlertDialogTitle>
        </AlertDialogHeader>
        <Form
          id={formId}
          method="patch"
          action={`/admin/users/${user.id}`}
          className="space-y-4"
        >
          <Input name="id" defaultValue={user.id} type="hidden" />
          <FieldWrapper label="Nombre completo" htmlFor="fullName">
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              defaultValue={user.fullName}
            />
          </FieldWrapper>
          <FieldWrapper label="Nombre de inicio de sesión" htmlFor="username">
            <Input
              id="username"
              name="username"
              autoComplete="username"
              defaultValue={user.username}
            />
          </FieldWrapper>
          <FieldWrapper label="Centro" htmlFor="siteId">
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
          <FieldWrapper label="Departamento" htmlFor="departmentId">
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
          <FieldWrapper label="Rol de usuario" htmlFor="role">
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
          >
            <Checkbox
              id={`isActive-${user.id}`}
              name="isActive"
              defaultChecked={Boolean(user.isActive)}
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

export default function UserDetailRoute() {
  return null;
}
