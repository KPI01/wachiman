import { PlusIcon } from "lucide-react";
import {
  AlertDialog,
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
import { useFetcher } from "react-router";
import { useEffect, useRef, useState } from "react";
import type { Site } from "../../../prisma/generated/prisma/client";
import AccessLogSignature from "~/components/models/access-logs/access-log-signature";
import { getFieldErrors } from "~/lib/utils/zod-errors";

 type FetcherErrors = {
  errors?: {
    properties?: Record<string, { errors?: string[] }>;
  };
};

type AccessLogSiteOption = Pick<Site, "id" | "name">;

type CreateAccessLogProps = {
  sites: AccessLogSiteOption[];
  actionPath?: string;
  lockedSiteId?: string;
};

function getDefaultEntryTimestamp() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export default function CreateAccessLog({
  sites,
  actionPath = "/access-logs",
  lockedSiteId,
}: CreateAccessLogProps) {
  const fetcher = useFetcher<FetcherErrors & { success?: boolean }>();
  const [open, setOpen] = useState(false);
  const [withVehicle, setWithVehicle] = useState(false);
  const [step, setStep] = useState<"details" | "signature">("details");
  const [hasSignature, setHasSignature] = useState(false);
  const [entrySignaturePayload, setEntrySignaturePayload] = useState("");
  const [pendingFormEntries, setPendingFormEntries] = useState<
    [string, string][]
  >([]);
  const [entryTimestamp, setEntryTimestamp] = useState(
    getDefaultEntryTimestamp,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const selectedSiteId = lockedSiteId ?? sites[0]?.id;

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data || fetcher.data.errors) {
      return;
    }

    setOpen(false);
    setWithVehicle(false);
    setEntryTimestamp(getDefaultEntryTimestamp());
    setStep("details");
    setHasSignature(false);
    setEntrySignaturePayload("");
    setPendingFormEntries([]);
  }, [fetcher.data, fetcher.state]);

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
          setEntrySignaturePayload("");
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
        <fetcher.Form
          ref={formRef}
          id="create-access-log"
          method="post"
          action={actionPath}
          className="grid min-h-0 gap-4 overflow-y-auto p-2 md:grid-cols-2"
        >
          {step === "details" ? (
            <>
              <FieldWrapper
                label="Centro"
                htmlFor="siteId"
                errors={getFieldErrors(fetcher.data?.errors, "siteId")}
              >
                {lockedSiteId ? (
                  <input type="hidden" name="siteId" value={lockedSiteId} />
                ) : null}
                <Select
                  name={lockedSiteId ? undefined : "siteId"}
                  {...(lockedSiteId
                    ? { value: selectedSiteId }
                    : { defaultValue: selectedSiteId })}
                  disabled={Boolean(lockedSiteId)}
                >
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
                errors={getFieldErrors(fetcher.data?.errors, "entryTimestamp")}
              >
                <Input
                  id="entryTimestamp"
                  name="entryTimestamp"
                  type="datetime-local"
                  value={entryTimestamp}
                  onChange={(event) => setEntryTimestamp(event.target.value)}
                  readOnly
                />
              </FieldWrapper>
              <FieldWrapper
                label="DNI/NIE *"
                htmlFor="legalIdSnapshot"
                errors={getFieldErrors(fetcher.data?.errors, "legalIdSnapshot")}
              >
                <Input
                  id="legalIdSnapshot"
                  name="legalIdSnapshot"
                  className="uppercase"
                  required
                />
              </FieldWrapper>
              <FieldWrapper
                label="Primer nombre *"
                htmlFor="firstNameSnapshot"
                errors={getFieldErrors(fetcher.data?.errors, "firstNameSnapshot")}
              >
                <Input
                  id="firstNameSnapshot"
                  name="firstNameSnapshot"
                  required
                />
              </FieldWrapper>
              <FieldWrapper
                label="Segundo nombre"
                htmlFor="middleNameSnapshot"
                errors={getFieldErrors(fetcher.data?.errors, "middleNameSnapshot")}
              >
                <Input id="middleNameSnapshot" name="middleNameSnapshot" />
              </FieldWrapper>
              <FieldWrapper
                label="Primer apellido *"
                htmlFor="lastNameSnapshot"
                errors={getFieldErrors(fetcher.data?.errors, "lastNameSnapshot")}
              >
                <Input id="lastNameSnapshot" name="lastNameSnapshot" required />
              </FieldWrapper>
              <FieldWrapper
                label="Segundo apellido"
                htmlFor="secondLastNameSnapshot"
                errors={getFieldErrors(fetcher.data?.errors, "secondLastNameSnapshot")}
              >
                <Input
                  id="secondLastNameSnapshot"
                  name="secondLastNameSnapshot"
                />
              </FieldWrapper>
              <FieldWrapper
                label="Empresa *"
                htmlFor="companyNameSnapshot"
                errors={getFieldErrors(fetcher.data?.errors, "companyNameSnapshot")}
              >
                <Input
                  id="companyNameSnapshot"
                  name="companyNameSnapshot"
                  required
                />
              </FieldWrapper>
              <FieldWrapper
                label="Telefono"
                htmlFor="phoneNumber"
                errors={getFieldErrors(fetcher.data?.errors, "phoneNumber")}
              >
                <Input id="phoneNumber" name="phoneNumber" />
              </FieldWrapper>
              <div className="md:col-span-2">
                <FieldWrapper
                  label="Motivo de visita *"
                  htmlFor="visitReason"
                  errors={getFieldErrors(fetcher.data?.errors, "visitReason")}
                >
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
                    errors={getFieldErrors(fetcher.data?.errors, "vehicleTypeSnapshot")}
                  >
                    <Input
                      id="vehicleTypeSnapshot"
                      name="vehicleTypeSnapshot"
                    />
                  </FieldWrapper>
                  <FieldWrapper
                    label="Marca"
                    htmlFor="vehicleBrandSnapshot"
                    errors={getFieldErrors(fetcher.data?.errors, "vehicleBrandSnapshot")}
                  >
                    <Input
                      id="vehicleBrandSnapshot"
                      name="vehicleBrandSnapshot"
                    />
                  </FieldWrapper>
                  <FieldWrapper
                    label="Modelo"
                    htmlFor="vehicleModelSnapshot"
                    errors={getFieldErrors(fetcher.data?.errors, "vehicleModelSnapshot")}
                  >
                    <Input
                      id="vehicleModelSnapshot"
                      name="vehicleModelSnapshot"
                    />
                  </FieldWrapper>
                  <FieldWrapper
                    label="Matrícula *"
                    htmlFor="vehiclePlateSnapshot"
                    errors={getFieldErrors(fetcher.data?.errors, "vehiclePlateSnapshot")}
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
              <input
                type="hidden"
                name="entrySignaturePayload"
                value={entrySignaturePayload}
              />
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
                onSignatureChange={setHasSignature}
                onSignaturePayloadChange={setEntrySignaturePayload}
              />
            </div>
          )}
        </fetcher.Form>
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
              <Button
                type="submit"
                form="create-access-log"
                disabled={!hasSignature || fetcher.state !== "idle"}
              >
                {fetcher.state === "submitting" ? "Enviando..." : "Enviar"}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
