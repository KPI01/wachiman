import { PlusIcon } from "lucide-react";
import { Form } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
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
import type { UserRole } from "../../../../generated/prisma/client";

const USER_ROLES: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MANAGEMENT: "Gestión",
  USER: "Usuario",
};

export default function CreateUser() {
  return (
    <AlertDialog>
      <AlertDialogTrigger className={buttonVariants({ variant: "default" })}>
        <PlusIcon />
        Crear usuario
      </AlertDialogTrigger>
      <AlertDialogContent>
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
          <FieldWrapper label="Rol de usuario" htmlFor="role">
            <Select defaultValue="USER">
              <SelectTrigger>
                <SelectValue placeholder="Rol para el usuario..." />
              </SelectTrigger>
              <SelectContent>
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
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="create-user">
            Enviar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
