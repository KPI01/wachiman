import { Form } from "react-router";
import CardContainer from "~/components/containers/card-container";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";

export default function Register() {
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
            autoComplete="new-password"
            required
          />
        </FieldWrapper>
        <FieldWrapper
          label="Confirmación de contraseña"
          htmlFor="password_confirmation"
        >
          <Input
            id="password_confirmation"
            name="password_confirmation"
            required
          />
        </FieldWrapper>
      </Form>
    </CardContainer>
  );
}
