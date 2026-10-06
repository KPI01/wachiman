import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { RotateCcwKeyIcon } from "lucide-react";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "~/components/ui/popover";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type ResetPasswordResponse = {
  success?: boolean;
  error?: string;
  errors?: unknown;
};

function getFormErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (!error) return undefined;

  const errorTree = error as {
    errors?: string[];
    properties?: Record<string, { errors?: string[] }>;
  };
  const messages = [
    ...(errorTree.errors ?? []),
    ...Object.values(errorTree.properties ?? {}).flatMap(
      (field) => field.errors ?? [],
    ),
  ];

  return messages.join(" ") || "No se pudo restablecer la contraseña.";
}

export default function ResetPasswordForm({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<ResetPasswordResponse>();
  const formRef = useRef<HTMLFormElement>(null);
  const errorMessage =
    fetcher.data?.error ?? getFormErrorMessage(fetcher.data?.errors);

  useEffect(() => {
    if (fetcher.data?.success) formRef.current?.reset();
  }, [fetcher.data]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((currentOpen) => !currentOpen)}
        >
          <RotateCcwKeyIcon data-icon="inline-start" />
          Restablecer contraseña
        </Button>
      </PopoverAnchor>
      <PopoverContent side="top" align="start" className="w-[min(24rem,calc(100vw-2rem))]">
        <fetcher.Form
          ref={formRef}
          className="grid gap-4"
          method="post"
          action={`/auth/reset-password/${userId}`}
        >
          <h3 className="text-sm font-semibold">Nueva contraseña</h3>
          <FieldWrapper
            label="Nueva contraseña"
            htmlFor={`newPassword-${userId}`}
            errors={getFieldErrors(fetcher.data?.errors, "newPassword")}
          >
            <Input
              id={`newPassword-${userId}`}
              type="password"
              name="newPassword"
              autoComplete="new-password"
              required
            />
          </FieldWrapper>
          <FieldWrapper
            label="Confirma la nueva contraseña"
            htmlFor={`newPasswordConfirmation-${userId}`}
            errors={getFieldErrors(fetcher.data?.errors, "newPasswordConfirmation")}
          >
            <Input
              id={`newPasswordConfirmation-${userId}`}
              type="password"
              name="newPasswordConfirmation"
              autoComplete="new-password"
              required
            />
          </FieldWrapper>
          {errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {fetcher.data?.success ? (
            <p className="text-sm text-primary" role="status">
              Contraseña restablecida.
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={fetcher.state !== "idle"}>
              {fetcher.state !== "idle" ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </div>
        </fetcher.Form>
      </PopoverContent>
    </Popover>
  );
}
