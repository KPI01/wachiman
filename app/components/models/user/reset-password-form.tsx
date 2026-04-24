import { RotateCcwKeyIcon } from "lucide-react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";

interface ResetPasswordFormProps {
  userId: string;
}

export default function ResetPasswordForm({ userId }: ResetPasswordFormProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          aria-label="Reestablecer clave"
        >
          <RotateCcwKeyIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="left">
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
