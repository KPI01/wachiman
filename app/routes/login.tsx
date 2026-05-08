import { Form, redirect } from "react-router";
import CardContainer from "~/components/containers/card-container";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import type { Route } from "./+types/login";
import { login } from "~/lib/auth.server";
import { getSessionUser, getUserRedirectPath } from "~/lib/session.server";
import { getFieldErrors } from "~/lib/utils/zod-errors";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getSessionUser(request);

  if (user) {
    throw redirect(getUserRedirectPath(user.role));
  }

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  return await login(request);
}

export default function Login({ actionData }: Route.ComponentProps) {
  return (
    <>
      <title>Inicio de sesión</title>
      <CardContainer
        title="Inicio de sesión"
        className="min-w-md "
        footer={
          <Button type="submit" form="login-form">
            Enviar
          </Button>
        }
      >
        <Form
          id="login-form"
          method="post"
          className="space-y-4"
          action="/login"
        >
          <FieldWrapper
            label="Nombre de usuario"
            htmlFor="username"
            errors={getFieldErrors(actionData?.errors, "username")}
          >
            <Input
              id="username"
              name="username"
              autoComplete="username"
              required
            />
          </FieldWrapper>

          <FieldWrapper
            label="Contraseña"
            htmlFor="password"
            errors={getFieldErrors(actionData?.errors, "password")}
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </FieldWrapper>
        </Form>
      </CardContainer>
    </>
  );
}
