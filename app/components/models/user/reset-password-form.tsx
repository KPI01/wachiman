import { RotateCcwKeyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "~/components/ui/popover";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";

interface ResetPasswordFormProps {
  userId: string;
}

export default function ResetPasswordForm({ userId }: ResetPasswordFormProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Button
          type="button"
          variant="secondary"
          aria-label="Reestablecer clave"
          onClick={() => setOpen((currentOpen) => !currentOpen)}
        >
          <RotateCcwKeyIcon />
        </Button>
      </PopoverAnchor>
      <PopoverContent side="left" className="min-w-fit">
        <Form
          className="space-y-4"
          method="post"
          action={`/auth/reset-password/${userId}`}
        >
          <FieldWrapper
            label="Nueva contraseña"
            htmlFor="newPassword"
            orientation="horizontal"
          >
            <Input
              id="newPassword"
              type="password"
              name="newPassword"
              required
            />
          </FieldWrapper>
          <FieldWrapper
            label="Confirma la nueva contraseña"
            htmlFor="newPasswordConfirmation"
            orientation="horizontal"
          >
            <Input
              id="newPasswordConfirmation"
              type="password"
              name="newPasswordConfirmation"
              required
            />
          </FieldWrapper>

          <div className="flex justify-end">
            <Button type="submit">Enviar</Button>
          </div>
        </Form>
      </PopoverContent>
    </Popover>
  );
}
