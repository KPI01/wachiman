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
import type { PlannedAccess, User } from "../../../../prisma/generated/prisma/client";
import { useFetcher } from "react-router";
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
import z from "zod";
import { updatePlannedAccessSchema } from "~/lib/schemas/planned-access";
import { PlannedAccessEntity } from "~/lib/database/planned-access.server";
import { PLANNED_ACCESS_STATUS_LABELS } from "~/lib/models/planned-access";
import { PlannedAccessStatus } from "../../../../prisma/generated/prisma/enums";
import { getFieldErrors } from "~/lib/utils/zod-errors";

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "PATCH") {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { success, error, data } =
      await updatePlannedAccessSchema.safeParseAsync(jsonData);

    if (!success) {
      return { errors: z.treeifyError(error) };
    }

    const { id, ...dataWithoutId } = data;

    await PlannedAccessEntity.update(id, dataWithoutId);

    return { success: true };
  }

  return null;
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type PlannedAccessDetailsProps = {
  plannedAccess: PlannedAccess & {
    approvedBy?: Pick<User, "id" | "fullName"> | null;
  };
  users: Pick<User, "id" | "fullName">[];
};

export function PlannedAccessDetails({ plannedAccess, users }: PlannedAccessDetailsProps) {
  const [open, setOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;

  const formId = `planned-access-form-${plannedAccess.id}`;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className={buttonVariants({ variant: "secondary" })}>
        <InfoIcon />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ficha de Acceso Planificado</AlertDialogTitle>
        </AlertDialogHeader>
        <patchFetcher.Form
          id={formId}
          method="patch"
          action={`/admin/planned-accesses/${plannedAccess.id}`}
          className="space-y-4"
        >
          <Input name="id" defaultValue={plannedAccess.id} type="hidden" />
          <FieldWrapper
            label="Inicio previsto"
            htmlFor={`expectedStartDate-${plannedAccess.id}`}
            errors={getFieldErrors(patchErrors, "expectedStartDate")}
          >
            <Input
              id={`expectedStartDate-${plannedAccess.id}`}
              name="expectedStartDate"
              type="datetime-local"
              defaultValue={formatDateTimeLocal(plannedAccess.expectedStartDate)}
            />
          </FieldWrapper>
          <FieldWrapper
            label="Fin previsto"
            htmlFor={`expectedEndDate-${plannedAccess.id}`}
            errors={getFieldErrors(patchErrors, "expectedEndDate")}
          >
            <Input
              id={`expectedEndDate-${plannedAccess.id}`}
              name="expectedEndDate"
              type="datetime-local"
              defaultValue={
                plannedAccess.expectedEndDate
                  ? formatDateTimeLocal(plannedAccess.expectedEndDate)
                  : ""
              }
            />
          </FieldWrapper>
          <FieldWrapper
            label="Estado"
            htmlFor={`status-${plannedAccess.id}`}
            errors={getFieldErrors(patchErrors, "status")}
          >
            <Select name="status" defaultValue={plannedAccess.status}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un estado..." />
              </SelectTrigger>
              <SelectContent position="popper">
                {(Object.keys(PLANNED_ACCESS_STATUS_LABELS) as PlannedAccessStatus[]).map(
                  (status) => (
                    <SelectItem key={status} value={status}>
                      {PLANNED_ACCESS_STATUS_LABELS[status]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </FieldWrapper>
          <FieldWrapper
            label="Aprobado por"
            htmlFor={`approvedById-${plannedAccess.id}`}
            errors={getFieldErrors(patchErrors, "approvedById")}
          >
            <Select
              name="approvedById"
              defaultValue={plannedAccess.approvedById}
            >
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

export default function PlannedAccessDetailRoute() {
  return null;
}
