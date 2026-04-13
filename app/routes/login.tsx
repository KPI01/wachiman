import { Form } from "react-router";
import CardContainer from "~/components/containers/card-container";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";

export async function action() {}

export default function Login() {
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
            autoComplete="current-password"
            required
          />
        </FieldWrapper>
      </Form>
    </CardContainer>
  );
}
