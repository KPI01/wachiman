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
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import type { AllowedArea, Company, Site } from "../../../../db/schema";
import AccessLogSignature from "./access-log-signature";
import { getFieldErrors } from "~/lib/utils/zod-errors";
import { Textarea } from "~/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import type { ExternalWorkerListItem } from "~/lib/database/external-worker.server";
import AccessLogTextCombobox from "./access-log-text-combobox";
import RiskInformationPreview from "./risk-information-preview";
import WorkRiskPreview from "./work-risk-preview";
import WorkPermitPreview, { type WorkPermitPreviewData } from "~/components/models/planned-access/work-permit-preview";
import AllowedAreaCombobox from "./allowed-area-combobox";
import CompanyCombobox from "../company/company-combobox";
import { getActionErrorMessage } from "~/lib/utils/action-errors";
import { useAppConfig } from "~/lib/app-config";
type FetcherErrors = {
  errors?: {
    properties?: Record<string, { errors?: string[] }>;
  };
};

type AccessLogSiteOption = Pick<Site, "id" | "name" | "address" | "riskInformation" | "riskInformationVersion">;

type CreateAccessLogProps = {
  sites: AccessLogSiteOption[];
  allowedAreas: Array<Pick<AllowedArea, "id" | "name">>;
  actionPath: string;
  lockedSiteId?: string;
  buttonLabel?: string;
  holder?: { legalName: string; taxId: string; fiscalAddress: string };
  companies: Array<Pick<Company, "id" | "name" | "cif" | "address">>;
  dailyRiskAcknowledgements?: Array<{ legalIdSnapshot: string; companyId: string | null; siteId: string; riskAcknowledgedAt: Date | null }>;
  workPermits?: Array<{ externalWorkerId: string | null; workPermit: WorkPermitPreviewData }>;
};

type AccessStep = "details" | "documentation" | "permit" | "signature";

const ACCESS_STEPS: Array<{ id: AccessStep; label: string }> = [
  { id: "details", label: "Datos" },
  { id: "documentation", label: "Riesgos" },
  { id: "permit", label: "Permiso" },
  { id: "signature", label: "Firma" },
];

function AccessStepIndicator({ currentStep, steps }: { currentStep: AccessStep; steps: Array<{ id: AccessStep; label: string }> }) {
  const currentIndex = steps.findIndex(({ id }) => id === currentStep);

  return (
    <ol className="grid grid-cols-4 gap-2 border-b px-2 pb-4 pt-2" aria-label="Progreso del registro de acceso">
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <li key={step.id} className="min-w-0">
            <div className={`flex items-center gap-2 text-xs font-medium ${isCurrent ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground"}`}>
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${isCurrent ? "border-primary bg-primary text-primary-foreground" : isComplete ? "border-foreground bg-foreground text-background" : "border-muted-foreground/40"}`}>
                {index + 1}
              </span>
              <span className="truncate">{step.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function getDefaultEntryTimestamp() {
  return new Date();
}

function getSignatureStrokes(payload: string) {
  if (!payload) return [];

  try {
    const parsed = JSON.parse(payload) as { strokes?: unknown };
    return Array.isArray(parsed.strokes) ? parsed.strokes as number[][][] : [];
  } catch {
    return [];
  }
}

export default function CreateAccessLog({
  sites,
  allowedAreas,
  actionPath,
  lockedSiteId,
  buttonLabel = "Nuevo acceso",
  holder,
  companies,
  dailyRiskAcknowledgements = [],
  workPermits = [],
}: CreateAccessLogProps) {
  const { workPermitsEnabled } = useAppConfig();
  const visibleSteps = workPermitsEnabled
    ? ACCESS_STEPS
    : ACCESS_STEPS.filter((item) => item.id !== "permit");
  const fetcher = useFetcher<FetcherErrors & { success?: boolean }>();
  const [open, setOpen] = useState(false);
  const [withVehicle, setWithVehicle] = useState(false);
  const [step, setStep] = useState<AccessStep>("details");
  const [hasSignature, setHasSignature] = useState(false);
  const [hasPermitSignature, setHasPermitSignature] = useState(false);
  const [entrySignaturePayload, setEntrySignaturePayload] = useState("");
  const [permitSignaturePayload, setPermitSignaturePayload] = useState("");
  const [pendingFormEntries, setPendingFormEntries] = useState<
    [string, string][]
  >([]);
  const [entryTimestamp, setEntryTimestamp] = useState(
    getDefaultEntryTimestamp,
  );
  const [selectedExternalWorkerId, setSelectedExternalWorkerId] = useState<
    string | null
  >(null);
  const [selectedWorkerRequiresWorkPermit, setSelectedWorkerRequiresWorkPermit] = useState(false);
  const [selectedWorkCategoryName, setSelectedWorkCategoryName] = useState<string | null>(null);
  const [selectedWorkCategoryRiskInformation, setSelectedWorkCategoryRiskInformation] = useState<string | null>(null);
  const [legalIdValue, setLegalIdValue] = useState("");
  const [companyNameValue, setCompanyNameValue] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [riskDocumentViewed, setRiskDocumentViewed] = useState(false);
  const [allowedAreaId, setAllowedAreaId] = useState("");
  const [approvedByValue, setApprovedByValue] = useState("");
  const [suggestions, setSuggestions] = useState<ExternalWorkerListItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const middleNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const secondLastNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);
  const [selectedSiteId, setSelectedSiteId] = useState(lockedSiteId ?? sites[0]?.id);
  const globalError =
    typeof fetcher.data?.errors === "string" ? fetcher.data.errors : null;
  const hasDailyRiskAcknowledgement = dailyRiskAcknowledgements.some(
    (entry) =>
      entry.legalIdSnapshot.toUpperCase() === legalIdValue.trim().toUpperCase() &&
      entry.siteId === selectedSiteId &&
      entry.riskAcknowledgedAt !== null,
  );
  const selectedWorkPermit = workPermits.find(
    (item) =>
      item.externalWorkerId === selectedExternalWorkerId ||
      item.workPermit.legalIdSnapshot.toUpperCase() === legalIdValue.trim().toUpperCase(),
  )?.workPermit ?? null;
  const permitForSignature = selectedWorkPermit && !hasDailyRiskAcknowledgement ? selectedWorkPermit : null;
  const missingWorkPermit = selectedWorkerRequiresWorkPermit && !selectedWorkPermit && !hasDailyRiskAcknowledgement;

  function getDraftValue(name: string) {
    return pendingFormEntries.find(([fieldName]) => fieldName === name)?.[1];
  }

  function saveDetailsDraft() {
    if (!formRef.current) return;
    setPendingFormEntries(
      Array.from(new FormData(formRef.current).entries()).map(
        ([name, value]) => [name, String(value)],
      ),
    );
  }

  function handleExternalWorkerSelect(worker: ExternalWorkerListItem) {
    setSelectedExternalWorkerId(worker.id);
    setSelectedWorkerRequiresWorkPermit(Boolean(worker.workCategory?.requiresWorkPermit));
    setSelectedWorkCategoryName(worker.workCategory?.name ?? null);
    setSelectedWorkCategoryRiskInformation(worker.workCategory?.riskInformation ?? null);
    setLegalIdValue(worker.legalId);

    if (firstNameRef.current) firstNameRef.current.value = worker.firstName;
    if (middleNameRef.current) {
      middleNameRef.current.value = worker.middleName ?? "";
    }
    if (lastNameRef.current) lastNameRef.current.value = worker.lastName;
    if (secondLastNameRef.current) {
      secondLastNameRef.current.value = worker.secondLastName ?? "";
    }
    if (phoneRef.current) phoneRef.current.value = worker.phoneNumber ?? "";
    setCompanyNameValue(worker.company?.name ?? "");
    setCompanyId(worker.company?.id ?? null);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function clearSelectedExternalWorker() {
    setSelectedExternalWorkerId(null);
    setSelectedWorkerRequiresWorkPermit(false);
    setSelectedWorkCategoryName(null);
    setSelectedWorkCategoryRiskInformation(null);

    if (firstNameRef.current) firstNameRef.current.value = "";
    if (middleNameRef.current) middleNameRef.current.value = "";
    if (lastNameRef.current) lastNameRef.current.value = "";
    if (secondLastNameRef.current) secondLastNameRef.current.value = "";
    if (phoneRef.current) phoneRef.current.value = "";

    setCompanyNameValue("");
    setCompanyId(null);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = legalIdValue.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedExternalWorkerId(null);
      setSelectedWorkerRequiresWorkPermit(false);
      setSelectedWorkCategoryName(null);
      setSelectedWorkCategoryRiskInformation(null);
      return;
    }

    const controller = new AbortController();
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query });
        const response = await fetch(`/api/external-workers/search?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        const data = (await response.json()) as ExternalWorkerListItem[];
        const normalizedLegalId = query.toUpperCase();
        const exactMatch = data.find(
          (worker) => worker.legalId.trim().toUpperCase() === normalizedLegalId,
        );

        if (exactMatch) {
          handleExternalWorkerSelect(exactMatch);
          return;
        }

        setSuggestions(data);
        setSelectedSuggestionIndex(0);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controller.abort();
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
      setSelectedSuggestionIndex((prev) =>
        Math.min(prev + 1, suggestions.length - 1),
      );
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
    if (fetcher.state !== "idle" || !fetcher.data) {
      return;
    }

    if (fetcher.data.errors) {
      toast.error(getActionErrorMessage(fetcher.data.errors));
      return;
    }

    toast.success("Acceso registrado correctamente");
    setOpen(false);
    setWithVehicle(false);
    setEntryTimestamp(getDefaultEntryTimestamp());
    setStep("details");
    setHasSignature(false);
    setHasPermitSignature(false);
    setEntrySignaturePayload("");
    setPermitSignaturePayload("");
    setPendingFormEntries([]);
    setSelectedExternalWorkerId(null);
    setSelectedWorkerRequiresWorkPermit(false);
    setSelectedWorkCategoryName(null);
    setSelectedWorkCategoryRiskInformation(null);
    setLegalIdValue("");
    setCompanyNameValue("");
    setCompanyId(null);
    setRiskAcknowledged(false);
    setRiskDocumentViewed(false);
    setAllowedAreaId("");
    setApprovedByValue("");
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
          setHasPermitSignature(false);
          setEntrySignaturePayload("");
          setPermitSignaturePayload("");
          setPendingFormEntries([]);
          setSelectedExternalWorkerId(null);
    setSelectedWorkerRequiresWorkPermit(false);
    setSelectedWorkCategoryName(null);
    setSelectedWorkCategoryRiskInformation(null);
          setLegalIdValue("");
          setCompanyNameValue("");
          setCompanyId(null);
          setRiskAcknowledged(false);
          setRiskDocumentViewed(false);
          setAllowedAreaId("");
          setApprovedByValue("");
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
        title={step === "details" ? "Nuevo Acceso" : step === "documentation" ? "Información y validación" : step === "permit" ? "Permiso de trabajo" : "Confirmación del visitante"}
      description={
         step === "details" ? (
          <>
            Ingresa los datos del acceso para almacenarlos en el sistema. <br />
            Los campos con (*) son obligatorios
          </>
         ) : step === "documentation" ? (
           "Revisa el documento y confirma que has recibido la información indicada antes de continuar."
          ) : step === "permit" ? (
            "Revisa el permiso de trabajo y solicita la firma del trabajador."
          ) : (
          <>
            Solicita al visitante que revise la información y firme para
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

                saveDetailsDraft();

                 if (hasDailyRiskAcknowledgement) {
                   setRiskDocumentViewed(true);
                   setRiskAcknowledged(true);
                     setStep("documentation");
                 } else {
                   setRiskDocumentViewed(true);
                   setStep("documentation");
                 }
              }}
            >
              Continuar
            </Button>
          ) : step === "documentation" ? (
            <>
              <Button type="button" variant="outline" onClick={() => setStep("details")}>Volver a los datos</Button>
                <Button type="button" onClick={() => setStep(workPermitsEnabled ? "permit" : "signature")} disabled={!riskDocumentViewed || !riskAcknowledged}>
                 Continuar
               </Button>
            </>
           ) : step === "permit" && workPermitsEnabled ? (
             <>
               <Button type="button" variant="outline" onClick={() => setStep(hasDailyRiskAcknowledgement ? "details" : "documentation")}>Volver</Button>
                <Button type="button" onClick={() => setStep("signature")} disabled={missingWorkPermit || (permitForSignature !== null && !hasPermitSignature)}>Continuar a la firma</Button>
             </>
           ) : (
            <>
              <Button
                type="button"
                variant="outline"
                  onClick={() => setStep(workPermitsEnabled ? "permit" : "documentation")}
              >
                Volver
              </Button>
              <Button
                type="submit"
                 form="create-access-log"
                  disabled={!hasSignature || (workPermitsEnabled && missingWorkPermit) || !riskAcknowledged || fetcher.state !== "idle"}
              >
                {fetcher.state === "submitting" ? "Enviando..." : "Enviar"}
              </Button>
            </>
          )}
        </>
      }
    >
      <AccessStepIndicator currentStep={step} steps={visibleSteps} />
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
                   value={selectedSiteId ?? ""}
                   onValueChange={setSelectedSiteId}
                  disabled={Boolean(lockedSiteId) || !sites.length}
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
                    if (selectedExternalWorkerId) {
                      clearSelectedExternalWorker();
                    }
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  onKeyDown={handleSuggestionKeyDown}
                  autoComplete="off"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={showSuggestions}
                  aria-controls="legalIdSnapshot-suggestions"
                  aria-activedescendant={
                    showSuggestions && suggestions[selectedSuggestionIndex]
                      ? `legalIdSnapshot-suggestion-${suggestions[selectedSuggestionIndex].id}`
                      : undefined
                  }
                />
                {selectedExternalWorkerId ? (
                  <input
                    type="hidden"
                    name="externalWorkerId"
                    value={selectedExternalWorkerId}
                  />
                ) : null}
                {selectedExternalWorkerId
                  ? /* Comentado: el flujo de documentación ya no se muestra. */
                    /* <div className="mt-2"> */
                    /*   <WorkerDocumentViewer workerId={selectedExternalWorkerId} /> */
                    /* </div> */
                    null
                  : null}
                {showSuggestions && suggestions.length > 0 && (
                  <ul
                    id="legalIdSnapshot-suggestions"
                    role="listbox"
                    className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
                  >
                    {suggestions.map((worker, index) => (
                      <li
                        key={worker.id}
                        id={`legalIdSnapshot-suggestion-${worker.id}`}
                        role="option"
                        aria-selected={index === selectedSuggestionIndex}
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
                          {worker.company?.name}
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
              <Input
                 ref={firstNameRef}
                 id="firstNameSnapshot"
                 name="firstNameSnapshot"
                 required
                 defaultValue={getDraftValue("firstNameSnapshot")}
              />
            </FieldWrapper>
            <FieldWrapper
              label="Segundo nombre"
              htmlFor="middleNameSnapshot"
              errors={getFieldErrors(
                fetcher.data?.errors,
                "middleNameSnapshot",
              )}
            >
              <Input
                 ref={middleNameRef}
                 id="middleNameSnapshot"
                 name="middleNameSnapshot"
                 defaultValue={getDraftValue("middleNameSnapshot")}
              />
            </FieldWrapper>
            <FieldWrapper
              label="Apellido(s) *"
              htmlFor="lastNameSnapshot"
              errors={getFieldErrors(fetcher.data?.errors, "lastNameSnapshot")}
            >
              <Input
                 ref={lastNameRef}
                 id="lastNameSnapshot"
                 name="lastNameSnapshot"
                 required
                 defaultValue={getDraftValue("lastNameSnapshot")}
              />
            </FieldWrapper>
            <FieldWrapper
              label="Segundo apellido"
              htmlFor="secondLastNameSnapshot"
              errors={getFieldErrors(
                fetcher.data?.errors,
                "secondLastNameSnapshot",
              )}
            >
              <Input
                 ref={secondLastNameRef}
                 id="secondLastNameSnapshot"
                 name="secondLastNameSnapshot"
                 defaultValue={getDraftValue("secondLastNameSnapshot")}
              />
            </FieldWrapper>
            <FieldWrapper
              label="Telefono"
              htmlFor="phoneNumber"
              errors={getFieldErrors(fetcher.data?.errors, "phoneNumber")}
            >
                <Input ref={phoneRef} id="phoneNumber" name="phoneNumber" defaultValue={getDraftValue("phoneNumber")} />
            </FieldWrapper>
            <FieldWrapper
              label="Empresa *"
              htmlFor="companyNameSnapshot"
              errors={getFieldErrors(
                fetcher.data?.errors,
                "companyNameSnapshot",
              )}
            >
              <CompanyCombobox
                id="companyNameSnapshot"
                name="companyNameSnapshot"
                options={companies}
                required
                requireSelection
                value={companyNameValue}
                onValueChange={setCompanyNameValue}
                onCompanyIdChange={setCompanyId}
              />
              <input type="hidden" name="companyId" value={companyId ?? ""} />
            </FieldWrapper>
            <FieldWrapper
              label="Área autorizada *"
              htmlFor="allowedAreaId-search"
              errors={getFieldErrors(fetcher.data?.errors, "allowedAreaId")}
            >
              <AllowedAreaCombobox
                name="allowedAreaId"
                options={allowedAreas}
                value={allowedAreaId}
                onValueChange={setAllowedAreaId}
                required
                requireSelection
              />
            </FieldWrapper>
            <FieldWrapper
              label="Aprobado por *"
              htmlFor="approvedBySnapshot"
              errors={getFieldErrors(
                fetcher.data?.errors,
                "approvedBySnapshot",
              )}
            >
              <AccessLogTextCombobox
                id="approvedBySnapshot"
                name="approvedBySnapshot"
                required
                value={approvedByValue}
                onValueChange={setApprovedByValue}
                searchPath="/api/access-logs/approved-by/search"
              />
            </FieldWrapper>

            <div className="md:col-span-2">
              <FieldWrapper
                label="Motivo de visita *"
                htmlFor="visitReason"
                errors={getFieldErrors(fetcher.data?.errors, "visitReason")}
              >
                <Textarea id="visitReason" name="visitReason" required defaultValue={getDraftValue("visitReason")} />
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
                    <Input id="vehicleTypeSnapshot" name="vehicleTypeSnapshot" defaultValue={getDraftValue("vehicleTypeSnapshot")} />
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
                   defaultValue={getDraftValue("vehicleBrandSnapshot")}
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
                   defaultValue={getDraftValue("vehicleModelSnapshot")}
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
                   defaultValue={getDraftValue("vehiclePlateSnapshot")}
                  />
                </FieldWrapper>
              </>
            )}
          </>
        ) : step === "documentation" ? (
          <div className="md:col-span-2 min-h-0 overflow-y-auto rounded-lg border">
            <RiskInformationPreview
              holderLegalName={holder?.legalName ?? ""}
              holderTaxId={holder?.taxId ?? ""}
              holderFiscalAddress={holder?.fiscalAddress ?? ""}
              siteName={sites.find((site) => site.id === selectedSiteId)?.name ?? ""}
              siteAddress={sites.find((site) => site.id === selectedSiteId)?.address}
              companyName={companyNameValue}
              companyCif={companies.find((company) => company.id === companyId)?.cif ?? ""}
              companyAddress={companies.find((company) => company.id === companyId)?.address ?? ""}
              workerName={[
                pendingFormEntries.find(([name]) => name === "firstNameSnapshot")?.[1],
                pendingFormEntries.find(([name]) => name === "middleNameSnapshot")?.[1],
                pendingFormEntries.find(([name]) => name === "lastNameSnapshot")?.[1],
                pendingFormEntries.find(([name]) => name === "secondLastNameSnapshot")?.[1],
              ].filter(Boolean).join(" ")}
              legalId={legalIdValue}
            />
            <label className="mx-4 mb-6 flex items-start gap-3 rounded-md border bg-muted/30 p-4 text-sm sm:mx-8">
              <Checkbox
                id="riskInformationAcknowledged"
                checked={riskAcknowledged}
                onCheckedChange={(checked) => setRiskAcknowledged(checked === true)}
              />
              <span>Confirmo que he leído este documento y que he sido informado de los riesgos e instrucciones preventivas indicados.</span>
            </label>
          </div>
        ) : step === "permit" && workPermitsEnabled ? (
          <div className="md:col-span-2 space-y-4">
            {selectedWorkCategoryRiskInformation || selectedWorkCategoryName || sites.find((site) => site.id === selectedSiteId)?.riskInformation ? (
              <>
                {permitForSignature ? <WorkPermitPreview workPermit={permitForSignature} /> : <WorkRiskPreview siteName={sites.find((site) => site.id === selectedSiteId)?.name ?? "Centro de trabajo"} siteAddress={sites.find((site) => site.id === selectedSiteId)?.address} facilityRiskInformation={sites.find((site) => site.id === selectedSiteId)?.riskInformation} workCategoryName={selectedWorkCategoryName} workCategoryRiskInformation={selectedWorkCategoryRiskInformation} companyName={companyNameValue} workerName={[getDraftValue("firstNameSnapshot"), getDraftValue("middleNameSnapshot"), getDraftValue("lastNameSnapshot"), getDraftValue("secondLastNameSnapshot")].filter(Boolean).join(" ")} legalId={legalIdValue} />}
                {permitForSignature ? <AccessLogSignature key={`permit-signature-${open}`} initialStrokes={getSignatureStrokes(permitSignaturePayload)} onSignatureChange={setHasPermitSignature} onSignaturePayloadChange={setPermitSignaturePayload} /> : null}
              </>
            ) : (
              <Alert>
                <AlertTitle>Permiso de trabajo</AlertTitle>
                <AlertDescription>{missingWorkPermit ? "Este trabajador requiere un permiso aprobado para continuar." : "No se requiere un permiso de trabajo adicional para este acceso."}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="md:col-span-2 space-y-4">
            <input
              type="hidden"
              name="entrySignaturePayload"
              value={entrySignaturePayload}
            />
            {workPermitsEnabled && permitForSignature ? <input type="hidden" name="workPermitId" value={permitForSignature.id} /> : null}
            {workPermitsEnabled ? <input type="hidden" name="workPermitSignaturePayload" value={permitSignaturePayload} /> : null}
            <input type="hidden" name="riskInformationAcknowledged" value={riskAcknowledged ? "true" : "false"} />
            {pendingFormEntries.map(([name, value], index) => (
              <input
                key={`${name}-${index}`}
                type="hidden"
                name={name}
                value={value}
              />
            ))}
            {workPermitsEnabled && missingWorkPermit ? (
              <Alert variant="destructive">
                <AlertTriangleIcon />
                <AlertTitle>Permiso de trabajo pendiente</AlertTitle>
                <AlertDescription>Este trabajador requiere un permiso de trabajo aprobado para el día del acceso.</AlertDescription>
              </Alert>
            ) : null}
            <AccessLogSignature
              key={`entry-signature-${open}`}
              initialStrokes={getSignatureStrokes(entrySignaturePayload)}
              onSignatureChange={setHasSignature}
              onSignaturePayloadChange={setEntrySignaturePayload}
            />
          </div>
        )}
      </fetcher.Form>
    </AlertDialogContainer>
  );
}
