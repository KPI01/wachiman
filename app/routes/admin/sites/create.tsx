import { PlusIcon } from "lucide-react";
import { Form } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type CreateSiteProps = {
  errors?: unknown;
};

export default function CreateSite({ errors }: CreateSiteProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className={buttonVariants({ variant: "default" })}>
        <PlusIcon />
        Crear centro
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Alta de Centro</AlertDialogTitle>
          <AlertDialogDescription>
            Ingresa los datos del centro para almacenarlos en el sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form
          id="create-site"
          method="post"
          action="/admin/sites"
          className="space-y-4"
        >
          <FieldWrapper
            label="Nombre"
            htmlFor="name"
            errors={getFieldErrors(errors, "name")}
          >
            <Input id="name" name="name" required />
          </FieldWrapper>
          <FieldWrapper
            label="Slug"
            htmlFor="slug"
            errors={getFieldErrors(errors, "slug")}
          >
            <Input id="slug" name="slug" className="uppercase" required />
          </FieldWrapper>
          <FieldWrapper
            label="Direccion"
            htmlFor="address"
            errors={getFieldErrors(errors, "address")}
          >
            <Input id="address" name="address" />
          </FieldWrapper>
        </Form>
        <AlertDialogFooter>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="create-site">
            Enviar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
