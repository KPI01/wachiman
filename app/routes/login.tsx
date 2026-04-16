import { performance } from "node:perf_hooks";
import { Form, redirect } from "react-router";
import CardContainer from "~/components/containers/card-container";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import type { Route } from "./+types/login";
import { loginSchema } from "~/lib/schemas/auth";
import z from "zod";
import { createSession } from "~/lib/session";
import { getUserByUsername } from "~/lib/database/user";

export async function action({ request }: Route.ActionArgs) {
  const start = performance.now();

  try {
    const rawFormData = await request.formData();
    const jsonData = Object.fromEntries(rawFormData);

    const { error, data } = await loginSchema.safeParseAsync(jsonData);

    if (error) {
      return { errors: z.treeifyError(error) };
    }

    const user = await getUserByUsername(data.username);

    if (!user) {
      return {
        errors: {
          username: {
            errors: ["El usuario no existe"],
          },
        },
      };
    }

    const sessionCookie = await createSession({
      user: {
        fullName: user.fullName,
        username: user.username,
        role: user.role,
      },
    });

    return redirect("/", {
      headers: {
        "Set-Cookie": sessionCookie,
      },
    });
  } finally {
    console.log(`[/login] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export default function Login({ actionData }: Route.ComponentProps) {
  if (actionData?.errors) console.error(actionData.errors);

  return (
    <CardContainer
      title="Inicio de sesión"
      className="min-w-md "
      footer={
        <Button type="submit" form="login-form">
          Enviar
        </Button>
      }
    >
      <Form id="login-form" method="post" className="space-y-4" action="/login">
        <FieldWrapper label="Nombre de usuario" htmlFor="username">
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
            autoComplete="current-password"
            required
          />
        </FieldWrapper>
      </Form>
    </CardContainer>
  );
}
