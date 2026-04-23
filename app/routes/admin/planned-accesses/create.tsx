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
import type { User } from "../../../../prisma/generated/prisma/client";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type CreatePlannedAccessProps = {
  users: Pick<User, "id" | "fullName">[];
  errors?: unknown;
};

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CreatePlannedAccess({ users, errors }: CreatePlannedAccessProps) {
  const now = new Date();
  const defaultStart = formatDateTimeLocal(now);

  return (
    <AlertDialog>
      <AlertDialogTrigger className={buttonVariants({ variant: "default" })}>
        <PlusIcon />
        Crear acceso planificado
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nuevo Acceso Planificado</AlertDialogTitle>
          <AlertDialogDescription>
            Ingresa los datos del acceso planificado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form
          id="create-planned-access"
          method="post"
          action="/admin/planned-accesses"
          className="space-y-4"
        >
          <FieldWrapper
            label="Inicio previsto"
            htmlFor="expectedStartDate"
            errors={getFieldErrors(errors, "expectedStartDate")}
          >
            <Input
              id="expectedStartDate"
              name="expectedStartDate"
              type="datetime-local"
              defaultValue={defaultStart}
              required
            />
          </FieldWrapper>
          <FieldWrapper
            label="Fin previsto"
            htmlFor="expectedEndDate"
            errors={getFieldErrors(errors, "expectedEndDate")}
          >
            <Input
              id="expectedEndDate"
              name="expectedEndDate"
              type="datetime-local"
            />
          </FieldWrapper>
          <FieldWrapper
            label="Aprobado por"
            htmlFor="approvedById"
            errors={getFieldErrors(errors, "approvedById")}
          >
            <Select name="approvedById" defaultValue={users[0]?.id}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un usuario..." />
              </SelectTrigger>
              <SelectContent position="popper">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrapper>
        </Form>
        <AlertDialogFooter>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="create-planned-access">
            Enviar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
