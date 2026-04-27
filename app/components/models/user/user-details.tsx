import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { USER_ROLES } from "~/lib/models/user";
import { getFieldErrors } from "~/lib/utils/zod-errors";
import type {
  Department,
  Site,
  User,
  UserRole,
} from "../../../../prisma/generated/prisma/client";

type UserDetailsProps = {
  user: User;
  sites: Site[];
  departments: Department[];
};

export default function UserDetails({
  user,
  sites,
  departments,
}: UserDetailsProps) {
  const [open, setOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();

  const patchErrors = patchFetcher.data?.errors;
  const formId = `user-form-${user.id}`;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="secondary"
        aria-label="Ver detalles del usuario"
        onClick={() => setOpen(true)}
      >
        <InfoIcon />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ficha de Usuario</AlertDialogTitle>
        </AlertDialogHeader>
        <patchFetcher.Form
          id={formId}
          method="patch"
          action={`/admin/users/${user.id}`}
          className="space-y-4"
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
