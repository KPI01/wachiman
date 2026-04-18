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

export default function CreateDepartment() {
  return (
    <AlertDialog>
      <AlertDialogTrigger className={buttonVariants({ variant: "default" })}>
        <PlusIcon />
        Crear departamento
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Alta de Departamento</AlertDialogTitle>
          <AlertDialogDescription>
            Ingresa los datos del departamento para almacenarlos en el sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form
          id="create-department"
          method="post"
          action="/admin/departments"
          className="space-y-4"
        >
          <FieldWrapper label="Nombre" htmlFor="name">
            <Input id="name" name="name" required />
          </FieldWrapper>
          <FieldWrapper label="Slug" htmlFor="slug">
            <Input id="slug" name="slug" className="uppercase" required />
          </FieldWrapper>
        </Form>
        <AlertDialogFooter>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="create-department">
            Enviar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
