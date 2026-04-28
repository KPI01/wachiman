import { PlusIcon, TrashIcon, UserPlusIcon, CarIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Form } from "react-router";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { formatTimestamp } from "~/lib/utils";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type CreatePlannedAccessProps = {
  errors?: unknown;
  actionPath?: string;
  buttonLabel?: ReactNode;
  title?: string;
  description?: string;
  submitLabel?: string;
};

type PersonForm = {
  firstNameSnapshot: string;
  middleNameSnapshot: string;
  lastNameSnapshot: string;
  secondLastNameSnapshot: string;
  legalIdSnapshot: string;
};

type VehicleForm = {
  typeSnapshot: string;
  brandSnapshot: string;
  modelSnapshot: string;
  plateSnapshot: string;
};

const emptyPerson: PersonForm = {
  firstNameSnapshot: "",
  middleNameSnapshot: "",
  lastNameSnapshot: "",
  secondLastNameSnapshot: "",
  legalIdSnapshot: "",
};

const emptyVehicle: VehicleForm = {
  typeSnapshot: "",
  brandSnapshot: "",
  modelSnapshot: "",
  plateSnapshot: "",
};

export default function CreatePlannedAccess({
  errors,
  actionPath = "/admin/planned-accesses",
  buttonLabel = (
    <>
      <PlusIcon />
      Crear
    </>
  ),
  title = "Nuevo Acceso Planificado",
  description = "Ingresa los datos del acceso planificado, personas y vehiculos.",
  submitLabel = "Enviar",
}: CreatePlannedAccessProps) {
  const now = new Date();
  const defaultStart = formatTimestamp({ date: now });

  const [persons, setPersons] = useState<PersonForm[]>([{ ...emptyPerson }]);
  const [vehicles, setVehicles] = useState<VehicleForm[]>([]);

  function addPerson() {
    setPersons((prev) => [...prev, { ...emptyPerson }]);
  }

  function removePerson(index: number) {
    setPersons((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePerson(index: number, field: keyof PersonForm, value: string) {
    setPersons((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  }

  function addVehicle() {
    setVehicles((prev) => [...prev, { ...emptyVehicle }]);
  }

  function removeVehicle(index: number) {
    setVehicles((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVehicle(
    index: number,
    field: keyof VehicleForm,
    value: string,
  ) {
    setVehicles((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  }

  return (
    <AlertDialogContainer
      buttonLabel={buttonLabel}
      title={title}
      description={description}
      contentClassName="max-h-[90vh] overflow-y-auto"
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="create-planned-access">
            {submitLabel}
          </AlertDialogAction>
        </>
      }
    >
      <Form
        id="create-planned-access"
        method="post"
        action={actionPath}
        className="space-y-6"
      >
        <div className="space-y-4 flex gap-2">
          <FieldWrapper
            label="Inicio previsto"
            htmlFor="expectedStartDate"
            errors={getFieldErrors(errors, "expectedStartDate")}
          >
            <Input
              id="expectedStartDate"
              name="expectedStartDate"
              type="datetime-local"
              defaultValue={defaultStart}
              required
            />
          </FieldWrapper>
          <FieldWrapper
            label="Fin previsto"
            htmlFor="expectedEndDate"
            errors={getFieldErrors(errors, "expectedEndDate")}
          >
            <Input
              id="expectedEndDate"
              name="expectedEndDate"
              type="datetime-local"
            />
          </FieldWrapper>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <UserPlusIcon className="w-5 h-5" />
              Personas
            </h3>
            <Button
              variant="outline"
              type="button"
              onClick={addPerson}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <PlusIcon className="w-4 h-4" />
              Agregar
            </Button>
          </div>
          {persons.map((person, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3 relative">
              {persons.length > 1 && (
                <Button
                  variant="destructive"
                  size="xs"
                  type="button"
                  onClick={() => removePerson(i)}
                  className="absolute top-2 right-2 text-destructive hover:text-destructive/80"
                  title="Quitar persona"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <FieldWrapper
                  label="Nombre"
                  htmlFor={`person-${i}-firstName`}
                  errors={getFieldErrors(
                    errors,
                    `persons[${i}].firstNameSnapshot`,
                  )}
                >
                  <Input
                    id={`person-${i}-firstName`}
                    name={`persons[${i}][firstNameSnapshot]`}
                    value={person.firstNameSnapshot}
                    onChange={(e) =>
                      updatePerson(i, "firstNameSnapshot", e.target.value)
                    }
                    required
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Segundo nombre"
                  htmlFor={`person-${i}-middleName`}
                  errors={getFieldErrors(
                    errors,
                    `persons[${i}].middleNameSnapshot`,
                  )}
                >
                  <Input
                    id={`person-${i}-middleName`}
                    name={`persons[${i}][middleNameSnapshot]`}
                    value={person.middleNameSnapshot}
                    onChange={(e) =>
                      updatePerson(i, "middleNameSnapshot", e.target.value)
                    }
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Apellido"
                  htmlFor={`person-${i}-lastName`}
                  errors={getFieldErrors(
                    errors,
                    `persons[${i}].lastNameSnapshot`,
                  )}
                >
                  <Input
                    id={`person-${i}-lastName`}
                    name={`persons[${i}][lastNameSnapshot]`}
                    value={person.lastNameSnapshot}
                    onChange={(e) =>
                      updatePerson(i, "lastNameSnapshot", e.target.value)
                    }
                    required
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Segundo apellido"
                  htmlFor={`person-${i}-secondLastName`}
                  errors={getFieldErrors(
                    errors,
                    `persons[${i}].secondLastNameSnapshot`,
                  )}
                >
                  <Input
                    id={`person-${i}-secondLastName`}
                    name={`persons[${i}][secondLastNameSnapshot]`}
                    value={person.secondLastNameSnapshot}
                    onChange={(e) =>
                      updatePerson(i, "secondLastNameSnapshot", e.target.value)
                    }
                  />
                </FieldWrapper>
                <div className="col-span-2">
                  <FieldWrapper
                    label="DNI/NIE"
                    htmlFor={`person-${i}-legalId`}
                    errors={getFieldErrors(
                      errors,
                      `persons[${i}].legalIdSnapshot`,
                    )}
                  >
                    <Input
                      id={`person-${i}-legalId`}
                      name={`persons[${i}][legalIdSnapshot]`}
                      value={person.legalIdSnapshot}
                      className="uppercase"
                      onChange={(e) =>
                        updatePerson(i, "legalIdSnapshot", e.target.value)
                      }
                      required
                    />
                  </FieldWrapper>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CarIcon className="w-5 h-5" />
              Vehiculos
            </h3>
            <Button
              variant="outline"
              type="button"
              onClick={addVehicle}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <PlusIcon className="w-4 h-4" />
              Agregar
            </Button>
          </div>
          {vehicles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Sin vehiculos registrados.
            </p>
          )}
          {vehicles.map((vehicle, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3 relative">
              <Button
                variant="destructive"
                size="xs"
                type="button"
                onClick={() => removeVehicle(i)}
                className="absolute top-2 right-2 text-destructive hover:text-destructive/80"
                title="Quitar vehiculo"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <FieldWrapper
                  label="Tipo"
                  htmlFor={`vehicle-${i}-type`}
                  errors={getFieldErrors(errors, `vehicles[${i}].typeSnapshot`)}
                >
                  <Input
                    id={`vehicle-${i}-type`}
                    name={`vehicles[${i}][typeSnapshot]`}
                    value={vehicle.typeSnapshot}
                    onChange={(e) =>
                      updateVehicle(i, "typeSnapshot", e.target.value)
                    }
                    required
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Marca"
                  htmlFor={`vehicle-${i}-brand`}
                  errors={getFieldErrors(
                    errors,
                    `vehicles[${i}].brandSnapshot`,
                  )}
                >
                  <Input
                    id={`vehicle-${i}-brand`}
                    name={`vehicles[${i}][brandSnapshot]`}
                    value={vehicle.brandSnapshot}
                    onChange={(e) =>
                      updateVehicle(i, "brandSnapshot", e.target.value)
                    }
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Modelo"
                  htmlFor={`vehicle-${i}-model`}
                  errors={getFieldErrors(
                    errors,
                    `vehicles[${i}].modelSnapshot`,
                  )}
                >
                  <Input
                    id={`vehicle-${i}-model`}
                    name={`vehicles[${i}][modelSnapshot]`}
                    value={vehicle.modelSnapshot}
                    onChange={(e) =>
                      updateVehicle(i, "modelSnapshot", e.target.value)
                    }
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Matrícula"
                  htmlFor={`vehicle-${i}-plate`}
                  errors={getFieldErrors(
                    errors,
                    `vehicles[${i}].plateSnapshot`,
                  )}
                >
                  <Input
                    id={`vehicle-${i}-plate`}
                    name={`vehicles[${i}][plateSnapshot]`}
                    value={vehicle.plateSnapshot}
                    className="uppercase"
                    onChange={(e) =>
                      updateVehicle(i, "plateSnapshot", e.target.value)
                    }
                    required
                  />
                </FieldWrapper>
              </div>
            </div>
          ))}
        </div>
      </Form>
    </AlertDialogContainer>
  );
}
