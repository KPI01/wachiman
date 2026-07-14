import { AlertTriangleIcon, PlusIcon } from "lucide-react";
import AlertDialogContainer, {
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Button } from "~/components/ui/button";
import { DateTimePicker } from "~/components/ui/date-time-picker";
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
import type { Site } from "../../../../prisma/generated/prisma/client";
import AccessLogSignature from "./access-log-signature";
import { getFieldErrors } from "~/lib/utils/zod-errors";
import { Textarea } from "~/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import type { ExternalWorkerListItem } from "~/lib/database/external-worker.server";

type FetcherErrors = {
  errors?: {
    properties?: Record<string, { errors?: string[] }>;
  };
};

type AccessLogSiteOption = Pick<Site, "id" | "name">;

type CreateAccessLogProps = {
  sites: AccessLogSiteOption[];
  actionPath: string;
  lockedSiteId?: string;
  buttonLabel?: string;
};

function getDefaultEntryTimestamp() {
  return new Date();
}

export default function CreateAccessLog({
  sites,
  actionPath,
  lockedSiteId,
  buttonLabel = "Nuevo acceso",
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
  const [selectedExternalWorkerId, setSelectedExternalWorkerId] = useState<
    string | null
  >(null);
  const [legalIdValue, setLegalIdValue] = useState("");
  const [suggestions, setSuggestions] = useState<ExternalWorkerListItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);
  const selectedSiteId = lockedSiteId ?? sites[0]?.id;
  const globalError =
    typeof fetcher.data?.errors === "string" ? fetcher.data.errors : null;

  function handleExternalWorkerSelect(worker: ExternalWorkerListItem) {
    setSelectedExternalWorkerId(worker.id);
    setLegalIdValue(worker.legalId);

    if (firstNameRef.current) firstNameRef.current.value = worker.firstName;
    if (lastNameRef.current) lastNameRef.current.value = worker.lastName;
    if (companyRef.current) companyRef.current.value = worker.company.name;
    if (phoneRef.current) phoneRef.current.value = worker.phoneNumber ?? "";
    setSuggestions([]);
    setShowSuggestions(false);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (legalIdValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedExternalWorkerId(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const params = new URLSearchParams({ q: legalIdValue });
      const response = await fetch(`/api/external-workers/search?${params}`);
      if (response.ok) {
        const data = await response.json() as ExternalWorkerListItem[];
        setSuggestions(data);
        setSelectedSuggestionIndex(0);
        setShowSuggestions(data.length > 0);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [legalIdValue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionContainerRef.current &&
        !suggestionContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSuggestionKeyDown(event: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedSuggestionIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedSuggestionIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleExternalWorkerSelect(suggestions[selectedSuggestionIndex]);
    } else if (event.key === "Escape") {
      setShowSuggestions(false);
    }
  }

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
    setSelectedExternalWorkerId(null);
    setLegalIdValue("");
    setSuggestions([]);
    setShowSuggestions(false);
  }, [fetcher.data, fetcher.state]);

  return (
    <AlertDialogContainer
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
          setSelectedExternalWorkerId(null);
          setLegalIdValue("");
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }}
      buttonClassName="ms-auto"
      buttonLabel={
        <>
          <PlusIcon />
          {buttonLabel}
        </>
      }
      contentClassName="flex max-h-9/10 w-[94vw] max-w-4xl flex-col overflow-hidden"
      title={step === "details" ? "Nuevo Acceso" : "Confirmacion del visitante"}
      description={
        step === "details" ? (
          <>
            Ingresa los datos del acceso para almacenarlos en el sistema. <br />
            Los campos con (*) son obligatorios
          </>
        ) : (
          <>
            Solicita al visitante que revise la informacion y firme para
            confirmar el registro.
            {globalError && (
              <Alert variant="destructive">
                <AlertTriangleIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            )}
          </>
        )
      }
      footer={
        <>
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
        </>
      }
    >
      <fetcher.Form
        ref={formRef}
        id="create-access-log"
        method="post"
        action={actionPath}
        className="grid min-h-0 gap-4 overflow-y-auto p-2 md:grid-cols-2"
      >
        {step === "details" ? (
          <>
            {lockedSiteId ? (
              <input type="hidden" name="siteId" value={lockedSiteId} />
            ) : null}
            {!lockedSiteId && (
              <FieldWrapper
                label="Centro"
                htmlFor="siteId"
                errors={getFieldErrors(fetcher.data?.errors, "siteId")}
              >
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
            )}
            <FieldWrapper
              label="Fecha y hora de ingreso"
              htmlFor="entryTimestamp"
              errors={getFieldErrors(fetcher.data?.errors, "entryTimestamp")}
            >
              <DateTimePicker
                id="entryTimestamp"
                name="entryTimestamp"
                value={entryTimestamp}
                className="m-0 w-full"
                readOnly
              />
            </FieldWrapper>
            <FieldWrapper
              label="DNI/NIE *"
              htmlFor="legalIdSnapshot"
              errors={getFieldErrors(fetcher.data?.errors, "legalIdSnapshot")}
            >
              <div ref={suggestionContainerRef} className="relative">
                <Input
                  id="legalIdSnapshot"
                  name="legalIdSnapshot"
                  className="uppercase"
                  required
                  value={legalIdValue}
                  onChange={(event) => {
                    setLegalIdValue(event.currentTarget.value);
                    setSelectedExternalWorkerId(null);
                  }}
                  onKeyDown={handleSuggestionKeyDown}
                  autoComplete="off"
                />
                {selectedExternalWorkerId ? (
                  <input
                    type="hidden"
                    name="externalWorkerId"
                    value={selectedExternalWorkerId}
                  />
                ) : null}
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                    {suggestions.map((worker, index) => (
                      <li
                        key={worker.id}
                        className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm ${
                          index === selectedSuggestionIndex
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        }`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleExternalWorkerSelect(worker);
                        }}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      >
                        <span className="font-medium">
                          {worker.firstName} {worker.lastName}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          {worker.legalId}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {worker.company.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </FieldWrapper>
            <FieldWrapper
              className="col-start-1"
              label="Nombre *"
              htmlFor="firstNameSnapshot"
              errors={getFieldErrors(fetcher.data?.errors, "firstNameSnapshot")}
            >
              <Input id="firstNameSnapshot" name="firstNameSnapshot" required />
            </FieldWrapper>
            <FieldWrapper
              label="Apellido(s) *"
              htmlFor="lastNameSnapshot"
              errors={getFieldErrors(fetcher.data?.errors, "lastNameSnapshot")}
            >
              <Input id="lastNameSnapshot" name="lastNameSnapshot" required />
            </FieldWrapper>
            <FieldWrapper
              label="Telefono"
              htmlFor="phoneNumber"
              errors={getFieldErrors(fetcher.data?.errors, "phoneNumber")}
            >
              <Input id="phoneNumber" name="phoneNumber" />
            </FieldWrapper>
            <FieldWrapper
              label="Empresa *"
              htmlFor="companyNameSnapshot"
              errors={getFieldErrors(
                fetcher.data?.errors,
                "companyNameSnapshot",
              )}
            >
              <Input
                id="companyNameSnapshot"
                name="companyNameSnapshot"
                required
              />
            </FieldWrapper>

            <div className="md:col-span-2">
              <FieldWrapper
                label="Motivo de visita *"
                htmlFor="visitReason"
                errors={getFieldErrors(fetcher.data?.errors, "visitReason")}
              >
                <Textarea id="visitReason" name="visitReason" required />
              </FieldWrapper>
            </div>
            <div className="md:col-span-2 flex items-center gap-3 rounded-md border px-3 py-2">
              <Checkbox
                id="withVehicle"
                name="withVehicle"
                checked={withVehicle}
                value="true"
                onCheckedChange={(checked) => setWithVehicle(checked === true)}
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
                  errors={getFieldErrors(
                    fetcher.data?.errors,
                    "vehicleTypeSnapshot",
                  )}
                >
                  <Input id="vehicleTypeSnapshot" name="vehicleTypeSnapshot" />
                </FieldWrapper>
                <FieldWrapper
                  label="Marca"
                  htmlFor="vehicleBrandSnapshot"
                  errors={getFieldErrors(
                    fetcher.data?.errors,
                    "vehicleBrandSnapshot",
                  )}
                >
                  <Input
                    id="vehicleBrandSnapshot"
                    name="vehicleBrandSnapshot"
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Modelo"
                  htmlFor="vehicleModelSnapshot"
                  errors={getFieldErrors(
                    fetcher.data?.errors,
                    "vehicleModelSnapshot",
                  )}
                >
                  <Input
                    id="vehicleModelSnapshot"
                    name="vehicleModelSnapshot"
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Matricula *"
                  htmlFor="vehiclePlateSnapshot"
                  errors={getFieldErrors(
                    fetcher.data?.errors,
                    "vehiclePlateSnapshot",
                  )}
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
    </AlertDialogContainer>
  );
}
