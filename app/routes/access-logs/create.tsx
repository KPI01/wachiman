import { PlusIcon } from "lucide-react";
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
import { Button, buttonVariants } from "~/components/ui/button";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Form } from "react-router";
import { useRef, useState } from "react";
import type { Site } from "../../../generated/prisma/client";
import AccessLogSignature from "~/components/models/access-logs/access-log-signature";

type CreateAccessLogProps = {
  sites: Site[];
};

function getDefaultEntryTimestamp() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export default function CreateAccessLog({ sites }: CreateAccessLogProps) {
  const [open, setOpen] = useState(false);
  const [withVehicle, setWithVehicle] = useState(false);
  const [step, setStep] = useState<"details" | "signature">("details");
  const [hasSignature, setHasSignature] = useState(false);
  const [pendingFormEntries, setPendingFormEntries] = useState<
    [string, string][]
  >([]);
  const [entryTimestamp, setEntryTimestamp] = useState(
    getDefaultEntryTimestamp,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setWithVehicle(false);
          setEntryTimestamp(getDefaultEntryTimestamp());
          setStep("details");
          setHasSignature(false);
          setPendingFormEntries([]);
        }
      }}
    >
      <AlertDialogTrigger className={buttonVariants({ variant: "default" })}>
        <PlusIcon />
        Crear acceso
      </AlertDialogTrigger>
      <AlertDialogContent className="flex max-h-9/10 min-w-xl max-w-4xl flex-col overflow-hidden">
        <AlertDialogHeader className="shrink-0">
          <AlertDialogTitle>
            {step === "details"
              ? "Alta de Acceso"
              : "Confirmacion del visitante"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {step === "details" ? (
              <>
                Ingresa los datos del acceso para almacenarlos en el sistema.{" "}
                <br />
                Los campos con (*) son obligatorios
              </>
            ) : (
              "Solicita al visitante que revise la informacion y firme para confirmar el registro."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form
          ref={formRef}
          id="create-access-log"
          method="post"
          action="/admin/access-logs"
          className="grid min-h-0 gap-4 overflow-y-auto p-2 md:grid-cols-2"
        >
          {step === "details" ? (
            <>
              <FieldWrapper label="Centro" htmlFor="siteId">
                <Select name="siteId" defaultValue={sites[0]?.id}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Centro para el acceso..." />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrapper>
              <FieldWrapper
                label="Fecha y hora de ingreso"
                htmlFor="entryTimestamp"
              >
                <Input
                  id="entryTimestamp"
                  name="entryTimestamp"
                  type="datetime-local"
                  value={entryTimestamp}
                  onChange={(event) => setEntryTimestamp(event.target.value)}
                  required
                />
              </FieldWrapper>
              <FieldWrapper label="DNI/NIE *" htmlFor="legalIdSnapshot">
                <Input
                  id="legalIdSnapshot"
                  name="legalIdSnapshot"
                  className="uppercase"
                  required
                />
              </FieldWrapper>
              <FieldWrapper label="Primer nombre *" htmlFor="firstNameSnapshot">
                <Input
                  id="firstNameSnapshot"
                  name="firstNameSnapshot"
                  required
                />
              </FieldWrapper>
              <FieldWrapper label="Segundo nombre" htmlFor="middleNameSnapshot">
                <Input id="middleNameSnapshot" name="middleNameSnapshot" />
              </FieldWrapper>
              <FieldWrapper
                label="Primer apellido *"
                htmlFor="lastNameSnapshot"
              >
                <Input id="lastNameSnapshot" name="lastNameSnapshot" required />
              </FieldWrapper>
              <FieldWrapper
                label="Segundo apellido"
                htmlFor="secondLastNameSnapshot"
              >
                <Input
                  id="secondLastNameSnapshot"
                  name="secondLastNameSnapshot"
                />
              </FieldWrapper>
              <FieldWrapper label="Empresa *" htmlFor="companyNameSnapshot">
                <Input
                  id="companyNameSnapshot"
                  name="companyNameSnapshot"
                  required
                />
              </FieldWrapper>
              <FieldWrapper label="Telefono" htmlFor="phoneNumber">
                <Input id="phoneNumber" name="phoneNumber" />
              </FieldWrapper>
              <div className="md:col-span-2">
                <FieldWrapper label="Motivo de visita *" htmlFor="visitReason">
                  <Input id="visitReason" name="visitReason" required />
                </FieldWrapper>
              </div>
              <div className="md:col-span-2 flex items-center gap-3 rounded-md border px-3 py-2">
                <Checkbox
                  id="withVehicle"
                  name="withVehicle"
                  checked={withVehicle}
                  value="true"
                  onCheckedChange={(checked) =>
                    setWithVehicle(checked === true)
                  }
                />
                <label htmlFor="withVehicle" className="text-sm font-medium">
                  El acceso fue realizado con vehiculo
                </label>
              </div>
              {withVehicle && (
                <>
                  <FieldWrapper
                    label="Tipo de vehiculo *"
                    htmlFor="vehicleTypeSnapshot"
                  >
                    <Input
                      id="vehicleTypeSnapshot"
                      name="vehicleTypeSnapshot"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Marca" htmlFor="vehicleBrandSnapshot">
                    <Input
                      id="vehicleBrandSnapshot"
                      name="vehicleBrandSnapshot"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Modelo" htmlFor="vehicleModelSnapshot">
                    <Input
                      id="vehicleModelSnapshot"
                      name="vehicleModelSnapshot"
                    />
                  </FieldWrapper>
                  <FieldWrapper
                    label="Matrícula *"
                    htmlFor="vehiclePlateSnapshot"
                  >
                    <Input
                      id="vehiclePlateSnapshot"
                      name="vehiclePlateSnapshot"
                      className="uppercase"
                    />
                  </FieldWrapper>
                </>
              )}
            </>
          ) : (
            <div className="md:col-span-2 space-y-4">
              {pendingFormEntries.map(([name, value], index) => (
                <input
                  key={`${name}-${index}`}
                  type="hidden"
                  name={name}
                  value={value}
                />
              ))}
              <AccessLogSignature
                key={`entry-signature-${open}`}
                inputName="entrySignaturePayload"
                onSignatureChange={setHasSignature}
              />
            </div>
          )}
        </Form>
        <AlertDialogFooter className="shrink-0">
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          {step === "details" ? (
            <Button
              type="button"
              onClick={() => {
                if (!formRef.current?.reportValidity()) {
                  return;
                }

                setPendingFormEntries(
                  Array.from(new FormData(formRef.current).entries()).map(
                    ([name, value]) => [name, String(value)],
                  ),
                );

                setStep("signature");
              }}
            >
              Continuar
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("details")}
              >
                Volver
              </Button>
              <AlertDialogAction
                type="submit"
                form="create-access-log"
                disabled={!hasSignature}
              >
                Enviar
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
