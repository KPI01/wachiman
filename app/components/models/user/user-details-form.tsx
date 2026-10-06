import { InfoIcon, LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import EntityDetailsDialog from "~/components/models/shared/entity-details-dialog";
import ResetPasswordForm from "~/components/models/user/reset-password-form";
import TrashUserBtn from "~/components/models/user/trash-user-btn";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
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
import type { Department, Site, User } from "../../../../db/schema";
import { type UserRole } from "../../../../db/enums";

type UserFormValues = {
  fullName: string;
  username: string;
  siteId: string;
  departmentId: string;
  role: string;
};

function getUserFormValues(user: User): UserFormValues {
  return {
    fullName: user.fullName,
    username: user.username,
    siteId: user.siteId,
    departmentId: user.departmentId,
    role: user.role ?? "ACCESS_OPERATOR",
  };
}

type UserDetailsProps = {
  user: User;
  sites: Site[];
  departments: Department[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

export default function UserDetails({
  user,
  sites,
  departments,
  open,
  onOpenChange,
  showTrigger = true,
}: UserDetailsProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const patchFetcher = useFetcher<{ error?: unknown }>();
  const statusFetcher = useFetcher<{ success?: boolean; error?: unknown }>();
  const [initialValues, setInitialValues] = useState(() => getUserFormValues(user));
  const [formValues, setFormValues] = useState(() => getUserFormValues(user));

  const patchErrors = patchFetcher.data?.error;
  const formId = `user-form-${user.id}`;
  const isDirty =
    formValues.fullName !== initialValues.fullName ||
    formValues.username !== initialValues.username ||
    formValues.siteId !== initialValues.siteId ||
    formValues.departmentId !== initialValues.departmentId ||
    formValues.role !== initialValues.role;
  const statusError = statusFetcher.data?.error;
  const statusErrorTree = statusError as
    | { errors?: string[]; properties?: Record<string, { errors?: string[] }> }
    | undefined;
  const statusErrorMessage =
    (typeof statusError === "string" ? statusError : undefined) ??
    statusErrorTree?.errors?.[0] ??
    Object.values(statusErrorTree?.properties ?? {}).flatMap(
      (field) => field.errors ?? [],
    )[0] ??
    (statusFetcher.data?.success === false
      ? "No se pudo cambiar el estado del usuario. Inténtalo de nuevo."
      : undefined);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      const currentValues = getUserFormValues(user);
      setInitialValues(currentValues);
      setFormValues(currentValues);
    }

    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      setLocalOpen(nextOpen);
    }
  }

  function updateFormValue<Key extends keyof UserFormValues>(
    key: Key,
    value: UserFormValues[Key],
  ) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function toggleUserActive() {
    statusFetcher.submit(
      {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        siteId: user.siteId,
        departmentId: user.departmentId,
        role: user.role ?? "ACCESS_OPERATOR",
        isActive: user.isActive ? "" : "on",
      },
      { method: "patch", action: `/admin/users?id=${user.id}` },
    );
  }

  return (
    <EntityDetailsDialog
      open={open ?? localOpen}
      onOpenChange={handleOpenChange}
      showTrigger={showTrigger}
      trigger={<InfoIcon aria-hidden="true" />}
      triggerLabel="Abrir ficha del usuario"
      title="Ficha del usuario"
      titleBadge={
        <Badge variant={user.isActive ? "default" : "secondary"}>
          {user.isActive ? "Activo" : "Inactivo"}
        </Badge>
      }
      description={`${user.fullName} · ${user.username}`}
      formId={formId}
      isSubmitting={patchFetcher.state !== "idle"}
      canSubmit={isDirty}
      showCancel={false}
      footerLeading={
        <div className="flex flex-wrap items-center gap-2">
          <TrashUserBtn
            userId={user.id}
            userName={user.fullName}
            onDeleted={() => handleOpenChange(false)}
          />
          <Button
            type="button"
            variant={user.isActive ? "destructive" : "default"}
            onClick={toggleUserActive}
            disabled={statusFetcher.state !== "idle"}
          >
            {statusFetcher.state !== "idle" ? (
              <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
            ) : null}
            {statusFetcher.state !== "idle"
              ? user.isActive
                ? "Desactivando…"
                : "Activando…"
              : user.isActive
                ? "Desactivar usuario"
                : "Activar usuario"}
          </Button>
          <ResetPasswordForm userId={user.id} />
        </div>
      }
    >
      <patchFetcher.Form
        id={formId}
        method="patch"
        action={`/admin/users?id=${user.id}`}
        className="grid gap-4 md:grid-cols-2"
      >
        <h3 className="text-sm font-semibold md:col-span-2">Datos del usuario</h3>
        <Input name="id" defaultValue={user.id} type="hidden" />
        <Input
          name="isActive"
          value={user.isActive ? "on" : ""}
          type="hidden"
          readOnly
        />
        {statusErrorMessage ? (
          <p className="text-sm text-destructive md:col-span-2" role="alert">
            {statusErrorMessage}
          </p>
        ) : null}
        <FieldWrapper
          label="Nombre completo"
          htmlFor="fullName"
          errors={getFieldErrors(patchErrors, "fullName")}
        >
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            value={formValues.fullName}
            onChange={(event) => updateFormValue("fullName", event.target.value)}
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
            value={formValues.username}
            onChange={(event) => updateFormValue("username", event.target.value)}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Centro"
          htmlFor="siteId"
          errors={getFieldErrors(patchErrors, "siteId")}
        >
          <Select
            name="siteId"
            value={formValues.siteId}
            onValueChange={(value) => updateFormValue("siteId", value)}
            disabled={!sites.length}
          >
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
          <Select
            name="departmentId"
            value={formValues.departmentId}
            onValueChange={(value) => updateFormValue("departmentId", value)}
            disabled={!departments.length}
          >
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
          <Select
            name="role"
            value={formValues.role}
            onValueChange={(value) => updateFormValue("role", value)}
          >
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
      </patchFetcher.Form>
    </EntityDetailsDialog>
  );
}
