import { PlusIcon } from "lucide-react";
import { Form } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import type { Department, Site, UserRole } from "../../../../generated/prisma/client";
import { USER_ROLES } from "~/lib/models/user";

type CreateUserProps = {
  sites: Site[];
  departments: Department[];
};

export default function CreateUser({ sites, departments }: CreateUserProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className={buttonVariants({ variant: "default" })}>
        <PlusIcon />
        Crear usuario
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Alta de Usuario</AlertDialogTitle>
          <AlertDialogDescription>
            Ingresa los datos del usuario para almacenarlos en el sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form
          id="create-user"
          method="post"
          action="/admin/users"
          className="space-y-4"
        >
          <FieldWrapper label="Nombre completo" htmlFor="fullName">
            <Input id="fullName" name="fullName" autoComplete="name" required />
          </FieldWrapper>
          <FieldWrapper label="Nombre de inicio de sesión" htmlFor="username">
            <Input
              id="username"
              name="username"
              autoComplete="username"
              required
            />
          </FieldWrapper>
          <FieldWrapper label="Centro" htmlFor="siteId">
            <Select name="siteId" defaultValue={sites[0]?.id}>
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
            <Select name="departmentId" defaultValue={departments[0]?.id}>
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
            <Select name="role" defaultValue="ACCESS_REQUESTER">
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
          <FieldWrapper label="Contraseña" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </FieldWrapper>
          <FieldWrapper
            label="Confirmación de contraseña"
            htmlFor="passwordConfirmation"
          >
            <Input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              required
            />
          </FieldWrapper>
        </Form>
        <AlertDialogFooter>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="create-user">
            Enviar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
