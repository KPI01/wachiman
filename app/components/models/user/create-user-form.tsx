import { PlusIcon } from "lucide-react";
import { Form } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import type { Department, Site } from "../../../../db/schema";
import { type UserRole } from "../../../../db/enums";
import { USER_ROLES } from "~/lib/models/user";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type CreateUserProps = {
  sites: Site[];
  departments: Department[];
  errors?: unknown;
};

export default function CreateUserForm({
  sites,
  departments,
  errors,
}: CreateUserProps) {
  return (
    <AlertDialogContainer
      buttonClassName="w-fit ms-auto"
      buttonLabel={
        <>
          <PlusIcon />
          <span className="text-base">Usuario</span>
        </>
      }
      title="Alta de Usuario"
      description="Ingresa los datos del usuario para almacenarlos en el sistema."
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="create-user">
            Enviar
          </AlertDialogAction>
        </>
      }
    >
      <Form
        id="create-user"
        method="post"
        action="/admin/users"
        className="space-y-4"
      >
        <FieldWrapper
          label="Nombre completo"
          htmlFor="fullName"
          errors={getFieldErrors(errors, "fullName")}
        >
          <Input id="fullName" name="fullName" autoComplete="name" required />
        </FieldWrapper>
        <FieldWrapper
          label="Nombre de inicio de sesión"
          htmlFor="username"
          errors={getFieldErrors(errors, "username")}
        >
          <Input
            id="username"
            name="username"
            autoComplete="username"
            required
          />
        </FieldWrapper>
        <FieldWrapper
          label="Centro"
          htmlFor="siteId"
          errors={getFieldErrors(errors, "siteId")}
        >
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
        <FieldWrapper
          label="Departamento"
          htmlFor="departmentId"
          errors={getFieldErrors(errors, "departmentId")}
        >
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
        <FieldWrapper
          label="Rol de usuario"
          htmlFor="role"
          errors={getFieldErrors(errors, "role")}
        >
          <Select name="role" defaultValue="ACCESS_OPERATOR">
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
          label="Contraseña"
          htmlFor="password"
          errors={getFieldErrors(errors, "password")}
        >
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
          errors={getFieldErrors(errors, "passwordConfirmation")}
        >
          <Input
            id="passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            required
          />
        </FieldWrapper>
      </Form>
    </AlertDialogContainer>
  );
}
