import { InfoIcon, PlusIcon, TrashIcon, UserPlusIcon, CarIcon } from "lucide-react";
import { useState } from "react";
import AlertDialogContainer, {
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Button, buttonVariants } from "~/components/ui/button";
import type {
  PlannedAccess,
  PlannedAccessPerson,
  PlannedAccessVehicle,
  User,
} from "../../../../prisma/generated/prisma/client";
import { useFetcher } from "react-router";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
import { getFieldErrors } from "~/lib/utils/zod-errors";

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type PlannedAccessDetailsProps = {
  plannedAccess: PlannedAccess & {
    approvedBy?: Pick<User, "id" | "fullName"> | null;
    plannedAccessPersons?: PlannedAccessPerson[];
    plannedAccessVehicles?: PlannedAccessVehicle[];
  };
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

export function PlannedAccessDetails({
  plannedAccess,
}: PlannedAccessDetailsProps) {
  const [open, setOpen] = useState(false);
  const patchFetcher = useFetcher<{ errors?: unknown }>();
  const patchErrors = patchFetcher.data?.errors;

  const [persons, setPersons] = useState<PersonForm[]>([]);
  const [vehicles, setVehicles] = useState<VehicleForm[]>([]);

  const formId = `planned-access-form-${plannedAccess.id}`;

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
      open={open}
      onOpenChange={setOpen}
      buttonLabel={<InfoIcon />}
      buttonVariant="secondary"
      title="Ficha de Acceso Planificado"
      contentClassName="max-h-[90vh] overflow-y-auto"
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form={formId}>
            Enviar
          </AlertDialogAction>
        </>
      }
    >
      <patchFetcher.Form
        id={formId}
        method="patch"
        action="/admin/planned-accesses"
        className="space-y-6"
      >
        <Input name="id" defaultValue={plannedAccess.id} type="hidden" />

        <div className="space-y-4 flex gap-2">
          <FieldWrapper
            label="Inicio previsto"
            htmlFor={`expectedStartDate-${plannedAccess.id}`}
            errors={getFieldErrors(patchErrors, "expectedStartDate")}
          >
            <Input
              id={`expectedStartDate-${plannedAccess.id}`}
              name="expectedStartDate"
              type="datetime-local"
              defaultValue={formatDateTimeLocal(plannedAccess.expectedStartDate)}
            />
          </FieldWrapper>
          <FieldWrapper
            label="Fin previsto"
            htmlFor={`expectedEndDate-${plannedAccess.id}`}
            errors={getFieldErrors(patchErrors, "expectedEndDate")}
          >
            <Input
              id={`expectedEndDate-${plannedAccess.id}`}
              name="expectedEndDate"
              type="datetime-local"
              defaultValue={
                plannedAccess.expectedEndDate
                  ? formatDateTimeLocal(plannedAccess.expectedEndDate)
                  : ""
              }
            />
          </FieldWrapper>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium">Personas existentes</h4>
          {plannedAccess.plannedAccessPersons &&
          plannedAccess.plannedAccessPersons.length > 0 ? (
            <ul className="space-y-1">
              {plannedAccess.plannedAccessPersons.map((p) => (
                <li key={p.id} className="text-sm">
                  {p.firstNameSnapshot} {p.middleNameSnapshot}{" "}
                  {p.lastNameSnapshot} {p.secondLastNameSnapshot} —{" "}
                  {p.legalIdSnapshot}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin personas</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <UserPlusIcon className="w-5 h-5" />
              Agregar personas
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
              <div className="grid grid-cols-2 gap-3">
                <FieldWrapper
                  label="Nombre"
                  htmlFor={`person-${plannedAccess.id}-${i}-firstName`}
                  errors={getFieldErrors(
                    patchErrors,
                    `persons[${i}].firstNameSnapshot`,
                  )}
                >
                  <Input
                    id={`person-${plannedAccess.id}-${i}-firstName`}
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
                  htmlFor={`person-${plannedAccess.id}-${i}-middleName`}
                  errors={getFieldErrors(
                    patchErrors,
                    `persons[${i}].middleNameSnapshot`,
                  )}
                >
                  <Input
                    id={`person-${plannedAccess.id}-${i}-middleName`}
                    name={`persons[${i}][middleNameSnapshot]`}
                    value={person.middleNameSnapshot}
                    onChange={(e) =>
                      updatePerson(i, "middleNameSnapshot", e.target.value)
                    }
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Apellido"
                  htmlFor={`person-${plannedAccess.id}-${i}-lastName`}
                  errors={getFieldErrors(
                    patchErrors,
                    `persons[${i}].lastNameSnapshot`,
                  )}
                >
                  <Input
                    id={`person-${plannedAccess.id}-${i}-lastName`}
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
                  htmlFor={`person-${plannedAccess.id}-${i}-secondLastName`}
                  errors={getFieldErrors(
                    patchErrors,
                    `persons[${i}].secondLastNameSnapshot`,
                  )}
                >
                  <Input
                    id={`person-${plannedAccess.id}-${i}-secondLastName`}
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
                    htmlFor={`person-${plannedAccess.id}-${i}-legalId`}
                    errors={getFieldErrors(
                      patchErrors,
                      `persons[${i}].legalIdSnapshot`,
                    )}
                  >
                    <Input
                      id={`person-${plannedAccess.id}-${i}-legalId`}
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

        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium">Vehículos existentes</h4>
          {plannedAccess.plannedAccessVehicles &&
          plannedAccess.plannedAccessVehicles.length > 0 ? (
            <ul className="space-y-1">
              {plannedAccess.plannedAccessVehicles.map((v) => (
                <li key={v.id} className="text-sm">
                  {v.typeSnapshot} {v.brandSnapshot} {v.modelSnapshot} —{" "}
                  {v.plateSnapshot}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin vehículos</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CarIcon className="w-5 h-5" />
              Agregar vehículos
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
                  htmlFor={`vehicle-${plannedAccess.id}-${i}-type`}
                  errors={getFieldErrors(
                    patchErrors,
                    `vehicles[${i}].typeSnapshot`,
                  )}
                >
                  <Input
                    id={`vehicle-${plannedAccess.id}-${i}-type`}
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
                  htmlFor={`vehicle-${plannedAccess.id}-${i}-brand`}
                  errors={getFieldErrors(
                    patchErrors,
                    `vehicles[${i}].brandSnapshot`,
                  )}
                >
                  <Input
                    id={`vehicle-${plannedAccess.id}-${i}-brand`}
                    name={`vehicles[${i}][brandSnapshot]`}
                    value={vehicle.brandSnapshot}
                    onChange={(e) =>
                      updateVehicle(i, "brandSnapshot", e.target.value)
                    }
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Modelo"
                  htmlFor={`vehicle-${plannedAccess.id}-${i}-model`}
                  errors={getFieldErrors(
                    patchErrors,
                    `vehicles[${i}].modelSnapshot`,
                  )}
                >
                  <Input
                    id={`vehicle-${plannedAccess.id}-${i}-model`}
                    name={`vehicles[${i}][modelSnapshot]`}
                    value={vehicle.modelSnapshot}
                    onChange={(e) =>
                      updateVehicle(i, "modelSnapshot", e.target.value)
                    }
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Matrícula"
                  htmlFor={`vehicle-${plannedAccess.id}-${i}-plate`}
                  errors={getFieldErrors(
                    patchErrors,
                    `vehicles[${i}].plateSnapshot`,
                  )}
                >
                  <Input
                    id={`vehicle-${plannedAccess.id}-${i}-plate`}
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
      </patchFetcher.Form>
    </AlertDialogContainer>
  );
}
