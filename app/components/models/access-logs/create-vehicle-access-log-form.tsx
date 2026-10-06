import {
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import AlertDialogContainer, {
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { DateTimePicker } from "~/components/ui/date-time-picker";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Separator } from "~/components/ui/separator";
import type { AllowedArea, Company, Site } from "../../../../db/schema";
import CompanyCombobox from "../company/company-combobox";
import AllowedAreaCombobox from "./allowed-area-combobox";
import AccessLogSignature from "./access-log-signature";
import AccessLogTextCombobox from "./access-log-text-combobox";
import RiskInformationPreview from "./risk-information-preview";

type Occupant = {
  id: string;
  legalIdSnapshot: string;
  firstNameSnapshot: string;
  lastNameSnapshot: string;
  phoneNumber: string;
};

type Draft = Omit<Occupant, "id">;
type SignatureState = { payload: string; acknowledged: boolean };
type SiteOption = Pick<
  Site,
  "id" | "name" | "address" | "riskInformation" | "riskInformationVersion"
>;

const emptyDraft: Draft = {
  legalIdSnapshot: "",
  firstNameSnapshot: "",
  lastNameSnapshot: "",
  phoneNumber: "",
};

const vehicleTypes = [
  "Turismo",
  "SUV / Todoterreno",
  "Furgoneta",
  "Camión",
  "Motocicleta",
  "Ciclomotor",
  "Bicicleta",
  "Maquinaria móvil",
  "Otro",
] as const;

function getDefaultTimestamp() {
  return new Date();
}

function VehicleAccessStepIndicator({
  currentStep,
}: {
  currentStep: "details" | "risks";
}) {
  const steps = [
    { id: "details", label: "Datos" },
    { id: "risks", label: "Riesgos y firma" },
  ] as const;
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <ol
      className="grid grid-cols-2 gap-2 border-b px-2 pb-4 pt-2"
      aria-label="Progreso del registro de acceso vehicular"
    >
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <li key={step.id} className="min-w-0">
            <div
              className={`flex items-center gap-2 text-sm font-medium ${
                isCurrent
                  ? "text-primary"
                  : isComplete
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : isComplete
                      ? "border-foreground bg-foreground text-background"
                      : "border-muted-foreground/40"
                }`}
              >
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

export default function CreateVehicleAccessLogForm({
  sites,
  allowedAreas,
  actionPath,
  lockedSiteId,
  holder,
  companies,
  buttonClassName = "ms-auto",
}: {
  sites: SiteOption[];
  allowedAreas: Array<Pick<AllowedArea, "id" | "name">>;
  actionPath: string;
  lockedSiteId?: string;
  holder?: { legalName: string; taxId: string; fiscalAddress: string };
  companies: Array<Pick<Company, "id" | "name" | "cif" | "address">>;
  buttonClassName?: string;
}) {
  const fetcher = useFetcher<{ success?: boolean; errors?: unknown }>();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"details" | "risks">("details");
  const [entryTimestamp, setEntryTimestamp] = useState(getDefaultTimestamp);
  const [siteId, setSiteId] = useState(lockedSiteId ?? sites[0]?.id ?? "");
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [allowedAreaId, setAllowedAreaId] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [visitReason, setVisitReason] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [activeOccupant, setActiveOccupant] = useState(0);
  const [signatures, setSignatures] = useState<Record<string, SignatureState>>(
    {},
  );
  const [occupantPopoverOpen, setOccupantPopoverOpen] = useState(false);

  const selectedSite = sites.find((site) => site.id === siteId);
  const selectedCompany = companies.find((company) => company.id === companyId);
  const currentOccupant = occupants[activeOccupant];
  const currentSignature = currentOccupant
    ? signatures[currentOccupant.id]
    : undefined;

  const payload = useMemo(
    () => ({
      entryTimestamp: entryTimestamp.toISOString(),
      siteId,
      companyNameSnapshot: companyName,
      companyId: companyId ?? "",
      allowedAreaId,
      approvedBySnapshot: approvedBy,
      visitReason,
      vehicle: {
        typeSnapshot: vehicleType,
        brandSnapshot: vehicleBrand,
        modelSnapshot: vehicleModel,
        plateSnapshot: vehiclePlate,
      },
      occupants: occupants.map((occupant) => ({
        ...occupant,
        entrySignaturePayload: signatures[occupant.id]?.payload ?? "",
        riskInformationAcknowledged:
          signatures[occupant.id]?.acknowledged ?? false,
      })),
    }),
    [
      allowedAreaId,
      approvedBy,
      companyId,
      companyName,
      entryTimestamp,
      occupants,
      signatures,
      siteId,
      vehicleBrand,
      vehicleModel,
      vehiclePlate,
      vehicleType,
      visitReason,
    ],
  );

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.errors) {
      toast.error(
        typeof fetcher.data.errors === "string"
          ? fetcher.data.errors
          : "No se pudo registrar el acceso vehicular.",
      );
      return;
    }
    toast.success("Acceso vehicular registrado correctamente");
    setOpen(false);
    reset();
  }, [fetcher.data, fetcher.state]);

  function reset() {
    setStep("details");
    setEntryTimestamp(getDefaultTimestamp());
    setSiteId(lockedSiteId ?? sites[0]?.id ?? "");
    setCompanyName("");
    setCompanyId(null);
    setAllowedAreaId("");
    setApprovedBy("");
    setVisitReason("");
    setVehicleType("");
    setVehicleBrand("");
    setVehicleModel("");
    setVehiclePlate("");
    setOccupants([]);
    setDraft(emptyDraft);
    setActiveOccupant(0);
    setSignatures({});
    setOccupantPopoverOpen(false);
  }

  function invalidateSignatures() {
    setSignatures((current) =>
      Object.keys(current).length > 0 ? {} : current,
    );
  }

  function addOccupant() {
    const next = {
      id: crypto.randomUUID(),
      ...draft,
      legalIdSnapshot: draft.legalIdSnapshot.trim().toUpperCase(),
      firstNameSnapshot: draft.firstNameSnapshot.trim(),
      lastNameSnapshot: draft.lastNameSnapshot.trim(),
      phoneNumber: draft.phoneNumber.trim(),
    };
    if (
      !next.legalIdSnapshot ||
      !next.firstNameSnapshot ||
      !next.lastNameSnapshot
    ) {
      toast.error("Completa DNI/NIE, nombres y apellidos del ocupante.");
      return;
    }
    if (
      occupants.some(
        (occupant) => occupant.legalIdSnapshot === next.legalIdSnapshot,
      )
    ) {
      toast.error("No puedes repetir el DNI/NIE de un ocupante.");
      return;
    }
    setOccupants((current) => [...current, next]);
    setDraft(emptyDraft);
    setSignatures({});
    setOccupantPopoverOpen(false);
  }

  function removeOccupant(id: string) {
    setOccupants((current) => current.filter((occupant) => occupant.id !== id));
    setSignatures((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setActiveOccupant((current) =>
      Math.max(0, Math.min(current, occupants.length - 2)),
    );
  }

  function startRiskReview() {
    if (
      !companyId ||
      !allowedAreaId ||
      !approvedBy ||
      !visitReason ||
      !vehicleType ||
      !vehiclePlate
    ) {
      toast.error(
        "Completa todos los datos comunes, del vehículo y del acceso.",
      );
      return;
    }
    if (occupants.length === 0) {
      toast.error("Añade al menos un ocupante.");
      return;
    }
    setActiveOccupant(0);
    setStep("risks");
  }

  function updateSignature(id: string, patch: Partial<SignatureState>) {
    setSignatures((current) => {
      const previous = current[id] ?? { payload: "", acknowledged: false };
      const next = { ...previous, ...patch };
      if (
        next.payload === previous.payload &&
        next.acknowledged === previous.acknowledged
      ) {
        return current;
      }
      return { ...current, [id]: next };
    });
  }

  const updateSignatureForCurrentOccupant = useCallback(
    (patch: Partial<SignatureState>) => {
      if (currentOccupant) updateSignature(currentOccupant.id, patch);
    },
    [currentOccupant],
  );

  const getSignatureStrokes = useCallback((payload: string | undefined) => {
    if (!payload) return [];
    try {
      const parsed = JSON.parse(payload) as { strokes?: unknown };
      return Array.isArray(parsed.strokes) ? (parsed.strokes as number[][][]) : [];
    } catch {
      return [];
    }
  }, []);

  const handleCurrentSignatureChange = useCallback(
    (hasSignature: boolean) => {
      if (!hasSignature) updateSignatureForCurrentOccupant({ payload: "" });
    },
    [updateSignatureForCurrentOccupant],
  );

  const handleCurrentSignaturePayloadChange = useCallback(
    (signaturePayload: string) => {
      updateSignatureForCurrentOccupant({ payload: signaturePayload });
    },
    [updateSignatureForCurrentOccupant],
  );

  const allSigned =
    occupants.length > 0 &&
    occupants.every((occupant) => {
      const signature = signatures[occupant.id];
      return Boolean(signature?.payload && signature.acknowledged);
    });

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) reset();
      }}
      buttonClassName={buttonClassName}
      buttonLabel={
        <>
          <PlusIcon /> Acceso de vehículo
        </>
      }
      contentClassName="flex max-h-9/10 w-[94vw] max-w-4xl flex-col overflow-hidden"
      title={
        step === "details"
          ? "Nuevo acceso vehicular"
          : "Información y validación"
      }
      description={
        step === "details"
          ? "Registra el vehículo y añade a sus ocupantes. Los campos con (*) son obligatorios."
          : `Cada ocupante debe leer la información de riesgos y firmar. Persona ${activeOccupant + 1} de ${occupants.length}.`
      }
      footer={
        step === "details" ? (
          <>
            <AlertDialogCancel variant="destructive">
              Cancelar
            </AlertDialogCancel>
            <Button type="button" onClick={startRiskReview}>
              Continuar a riesgos
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("details")}
            >
              Volver a los datos
            </Button>
            {activeOccupant < occupants.length - 1 ? (
              <Button
                type="button"
                onClick={() => setActiveOccupant((current) => current + 1)}
                disabled={
                  !currentSignature?.payload || !currentSignature.acknowledged
                }
              >
                Siguiente persona
              </Button>
            ) : (
              <fetcher.Form method="post" action={actionPath}>
                <input type="hidden" name="intent" value="vehicle-access" />
                <input
                  type="hidden"
                  name="vehicleAccessPayload"
                  value={JSON.stringify(payload)}
                />
                <Button
                  type="submit"
                  disabled={!allSigned || fetcher.state !== "idle"}
                >
                  {fetcher.state === "submitting"
                    ? "Registrando..."
                    : "Registrar acceso vehicular"}
                </Button>
              </fetcher.Form>
            )}
          </>
        )
      }
    >
      <VehicleAccessStepIndicator currentStep={step} />
      {step === "details" ? (
        <div className="min-h-0 overflow-y-auto p-2">
          <div className="grid min-w-0 gap-x-6 gap-y-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold">Vehículo</h3>
              <p className="text-sm text-muted-foreground">
                Los datos se compartirán con todos los registros de este ingreso.
              </p>
            </div>
            <FieldWrapper
              className="min-w-0"
              label="Centro"
              htmlFor="vehicle-site"
            >
              <Select
                value={siteId}
                onValueChange={(value) => {
                  setSiteId(value);
                  invalidateSignatures();
                }}
                disabled={Boolean(lockedSiteId)}
              >
                <SelectTrigger id="vehicle-site" className="w-full">
                  <SelectValue placeholder="Selecciona un centro" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrapper>
            <FieldWrapper
              className="min-w-0"
              label="Fecha y hora de ingreso"
              htmlFor="vehicle-entry"
            >
              <DateTimePicker
                id="vehicle-entry"
                value={entryTimestamp}
                className="m-0 w-full"
                readOnly
              />
            </FieldWrapper>
            <FieldWrapper
              className="min-w-0"
              label="Tipo de vehículo *"
              htmlFor="vehicle-type"
            >
              <Select
                value={vehicleType}
                onValueChange={(value) => {
                  setVehicleType(value);
                  invalidateSignatures();
                }}
              >
                <SelectTrigger id="vehicle-type" className="w-full">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrapper>
            <FieldWrapper
              className="min-w-0"
              label="Matrícula *"
              htmlFor="vehicle-plate"
            >
              <Input
                id="vehicle-plate"
                className="uppercase"
                value={vehiclePlate}
                onChange={(event) => {
                  setVehiclePlate(event.currentTarget.value);
                  invalidateSignatures();
                }}
              />
            </FieldWrapper>
            <FieldWrapper
              className="min-w-0"
              label="Marca"
              htmlFor="vehicle-brand"
            >
              <Input
                id="vehicle-brand"
                value={vehicleBrand}
                onChange={(event) => {
                  setVehicleBrand(event.currentTarget.value);
                  invalidateSignatures();
                }}
              />
            </FieldWrapper>
            <FieldWrapper
              className="min-w-0"
              label="Modelo"
              htmlFor="vehicle-model"
            >
              <Input
                id="vehicle-model"
                value={vehicleModel}
                onChange={(event) => {
                  setVehicleModel(event.currentTarget.value);
                  invalidateSignatures();
                }}
              />
            </FieldWrapper>

            <Separator className="md:col-span-2" />
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold">Datos de autorización</h3>
              <p className="text-sm text-muted-foreground">
                Se aplican a todos los ocupantes.
              </p>
            </div>
            <FieldWrapper
              className="min-w-0 md:col-span-2"
              label="Empresa *"
              htmlFor="vehicle-company"
            >
              <CompanyCombobox
                id="vehicle-company"
                name="vehicle-company"
                options={companies}
                value={companyName}
                onValueChange={(value) => {
                  setCompanyName(value);
                  invalidateSignatures();
                }}
                onCompanyIdChange={(value) => {
                  setCompanyId(value);
                  invalidateSignatures();
                }}
                requireSelection
              />
            </FieldWrapper>
            <FieldWrapper
              className="min-w-0"
              label="Área autorizada *"
              htmlFor="vehicle-area"
            >
              <AllowedAreaCombobox
                name="vehicle-area"
                options={allowedAreas}
                value={allowedAreaId}
                onValueChange={(value) => {
                  setAllowedAreaId(value);
                  invalidateSignatures();
                }}
                requireSelection
              />
            </FieldWrapper>
            <FieldWrapper
              className="min-w-0"
              label="Aprobado por *"
              htmlFor="vehicle-approved"
            >
              <AccessLogTextCombobox
                id="vehicle-approved"
                name="vehicle-approved"
                value={approvedBy}
                onValueChange={(value) => {
                  setApprovedBy(value);
                  invalidateSignatures();
                }}
                searchPath="/api/access-logs/approved-by/search"
              />
            </FieldWrapper>
            <FieldWrapper
              className="min-w-0 md:col-span-2"
              label="Motivo de visita *"
              htmlFor="vehicle-reason"
            >
              <Textarea
                id="vehicle-reason"
                className="min-h-24 w-full"
                value={visitReason}
                onChange={(event) => {
                  setVisitReason(event.currentTarget.value);
                  invalidateSignatures();
                }}
              />
            </FieldWrapper>

            <Separator className="md:col-span-2" />
            <div className="flex min-w-0 items-center justify-between gap-3 md:col-span-2">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold">Ocupantes</h3>
                <p className="text-sm text-muted-foreground">
                  {occupants.length} {occupants.length === 1 ? "persona" : "personas"} añadidas
                </p>
              </div>
              <Popover
                open={occupantPopoverOpen}
                onOpenChange={setOccupantPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    aria-label="Añadir ocupante"
                  >
                    <PlusIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="end"
                  className="w-[min(24rem,calc(100vw-2rem))] max-h-[min(70vh,30rem)] overflow-y-auto"
                >
                  <PopoverHeader>
                    <PopoverTitle>Añadir ocupante</PopoverTitle>
                    <PopoverDescription>
                      Introduce los datos de la persona que viaja en el vehículo.
                    </PopoverDescription>
                  </PopoverHeader>
                  <div className="space-y-4">
                    <FieldWrapper
                      label="DNI/NIE *"
                      htmlFor="vehicle-occupant-legal-id"
                    >
                      <Input
                        id="vehicle-occupant-legal-id"
                        className="w-full uppercase"
                        value={draft.legalIdSnapshot}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setDraft((current) => ({
                            ...current,
                            legalIdSnapshot: value,
                          }));
                        }}
                      />
                    </FieldWrapper>
                    <FieldWrapper
                      label="Nombres *"
                      htmlFor="vehicle-occupant-first-name"
                    >
                      <Input
                        id="vehicle-occupant-first-name"
                        className="w-full"
                        value={draft.firstNameSnapshot}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setDraft((current) => ({
                            ...current,
                            firstNameSnapshot: value,
                          }));
                        }}
                      />
                    </FieldWrapper>
                    <FieldWrapper
                      label="Apellidos *"
                      htmlFor="vehicle-occupant-last-name"
                    >
                      <Input
                        id="vehicle-occupant-last-name"
                        className="w-full"
                        value={draft.lastNameSnapshot}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setDraft((current) => ({
                            ...current,
                            lastNameSnapshot: value,
                          }));
                        }}
                      />
                    </FieldWrapper>
                    <FieldWrapper
                      label="Teléfono"
                      htmlFor="vehicle-occupant-phone"
                    >
                      <Input
                        id="vehicle-occupant-phone"
                        className="w-full"
                        value={draft.phoneNumber}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setDraft((current) => ({
                            ...current,
                            phoneNumber: value,
                          }));
                        }}
                      />
                    </FieldWrapper>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={addOccupant}
                    >
                      <PlusIcon /> Añadir ocupante
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {occupants.map((occupant, index) => (
              <div
                key={occupant.id}
                className="flex min-w-0 items-center gap-3 rounded-lg border p-3 md:col-span-2"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {occupant.firstNameSnapshot} {occupant.lastNameSnapshot}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {occupant.legalIdSnapshot}
                    {occupant.phoneNumber ? ` · ${occupant.phoneNumber}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOccupant(occupant.id)}
                  aria-label={`Eliminar a ${occupant.firstNameSnapshot}`}
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : currentOccupant ? (
        <div className="min-h-0 overflow-y-auto space-y-4 p-2">
          <div className="flex flex-wrap gap-2">
            {occupants.map((occupant, index) => (
              <Button
                key={occupant.id}
                type="button"
                size="sm"
                variant={
                  index === activeOccupant
                    ? "default"
                    : signatures[occupant.id]?.payload &&
                        signatures[occupant.id]?.acknowledged
                      ? "secondary"
                      : "outline"
                }
                onClick={() => setActiveOccupant(index)}
              >
                {" "}
                {index + 1}. {occupant.firstNameSnapshot}
              </Button>
            ))}
          </div>
          <div className="min-h-0 overflow-y-auto rounded-lg border">
            <RiskInformationPreview
              holderLegalName={holder?.legalName ?? ""}
              holderTaxId={holder?.taxId ?? ""}
              holderFiscalAddress={holder?.fiscalAddress ?? ""}
              siteName={selectedSite?.name ?? ""}
              siteAddress={selectedSite?.address}
              facilityRiskInformation={selectedSite?.riskInformation}
              facilityRiskInformationVersion={selectedSite?.riskInformationVersion}
              companyName={selectedCompany?.name ?? companyName}
              companyCif={selectedCompany?.cif ?? ""}
              companyAddress={selectedCompany?.address ?? ""}
              workerName={`${currentOccupant.firstNameSnapshot} ${currentOccupant.lastNameSnapshot}`}
              legalId={currentOccupant.legalIdSnapshot}
            />
            <label className="mx-4 mb-6 flex items-start gap-3 rounded-md border bg-muted/30 p-4 text-sm sm:mx-8">
              <Checkbox
                checked={currentSignature?.acknowledged ?? false}
                onCheckedChange={(checked) =>
                  updateSignatureForCurrentOccupant({
                    acknowledged: checked === true,
                  })
                }
              />
              <span>
                Confirmo que he leído este documento y que he sido informado de
                los riesgos e instrucciones preventivas indicados.
              </span>
            </label>
          </div>
          <AccessLogSignature
            key={currentOccupant.id}
            initialStrokes={getSignatureStrokes(currentSignature?.payload)}
            onSignatureChange={handleCurrentSignatureChange}
            onSignaturePayloadChange={handleCurrentSignaturePayloadChange}
          />
        </div>
      ) : null}
    </AlertDialogContainer>
  );
}
