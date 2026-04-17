import { performance } from "node:perf_hooks";
import { Form, redirect } from "react-router";
import CardContainer from "~/components/containers/card-container";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import type { Route } from "./+types/register";
import { registerSchema } from "~/lib/schemas/auth";
import z from "zod";
import { createUser } from "~/lib/database/user";
import { getSessionUser, getUserRedirectPath } from "~/lib/session";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getSessionUser(request);

  if (user) {
    throw redirect(getUserRedirectPath(user.role));
  }

  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const start = performance.now();

  try {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);
    const { error, data } = await registerSchema.safeParseAsync(jsonData);

    if (error) {
      return { errors: z.treeifyError(error) };
    }

    await createUser(data);

    return redirect("/login");
  } finally {
    console.log(`[/register] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export default function Register({ actionData }: Route.ComponentProps) {
  if (actionData?.errors) console.error(actionData.errors);

  return (
    <CardContainer
      className="min-w-lg"
      title="Registro de usuario"
      footer={
        <Button type="submit" form="register-form">
          Enviar
        </Button>
      }
    >
      <Form
        id="register-form"
        method="post"
        action="/register"
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
    </CardContainer>
  );
}
