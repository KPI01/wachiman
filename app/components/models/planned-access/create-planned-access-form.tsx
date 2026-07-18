import { AlertTriangleIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import AlertDialogContainer, {
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { DateTimePicker } from "~/components/ui/date-time-picker";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import { getFieldErrors } from "~/lib/utils/zod-errors";
import type { Site } from "../../../../db/schema";
import type { ExternalWorkerListItem } from "~/lib/database/external-worker.server";

type PlannedAccessSiteOption = Pick<Site, "id" | "name">;

type CreatePlannedAccessFormProps = {
  sites: PlannedAccessSiteOption[];
  actionPath?: string;
  lockedSiteId?: string;
};

type TreeifiedError = {
  errors?: string[];
  properties?: Record<
    string,
    TreeifiedError & {
      items?: Array<TreeifiedError | undefined>;
    }
  >;
};

type FetcherData = {
  success?: boolean;
  errors?: unknown;
};

type VisitorDraft = {
  legalIdSnapshot: string;
  firstNameSnapshot: string;
  lastNameSnapshot: string;
  phoneNumber: string;
  externalWorkerId: string;
};

type PlannedAccessVisitor = VisitorDraft & {
  id: number;
};

type VisitorDraftErrors = Partial<Record<keyof VisitorDraft, string>>;

function getEmptyVisitorDraft(): VisitorDraft {
  return {
    legalIdSnapshot: "",
    firstNameSnapshot: "",
    lastNameSnapshot: "",
    phoneNumber: "",
    externalWorkerId: "",
  };
}

function getPersonFieldErrors(
  errorTree: unknown,
  personIndex: number,
  fieldName: string,
) {
  const tree = errorTree as TreeifiedError | undefined;
  const fieldErrors =
    tree?.properties?.persons?.items?.[personIndex]?.properties?.[fieldName]
      ?.errors;

  return fieldErrors && fieldErrors.length > 0 ? fieldErrors : undefined;
}

function getPersonErrors(errorTree: unknown, personIndex: number) {
  const fields = [
    "legalIdSnapshot",
    "firstNameSnapshot",
    "lastNameSnapshot",
    "phoneNumber",
  ];
  const errors = fields.flatMap(
    (fieldName) => getPersonFieldErrors(errorTree, personIndex, fieldName) ?? [],
  );

  return errors.length > 0 ? [...new Set(errors)] : undefined;
}

function getVisitorFullName(visitor: VisitorDraft) {
  return [visitor.firstNameSnapshot, visitor.lastNameSnapshot]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");
}

function normalizeVisitorDraft(visitor: VisitorDraft): VisitorDraft {
  return {
    legalIdSnapshot: visitor.legalIdSnapshot.trim().toUpperCase(),
    firstNameSnapshot: visitor.firstNameSnapshot.trim(),
    lastNameSnapshot: visitor.lastNameSnapshot.trim(),
    phoneNumber: visitor.phoneNumber.trim(),
    externalWorkerId: visitor.externalWorkerId.trim(),
  };
}

function validateVisitorDraft(visitor: VisitorDraft): VisitorDraftErrors {
  const errors: VisitorDraftErrors = {};

  if (!visitor.legalIdSnapshot.trim()) {
    errors.legalIdSnapshot = "El DNI es obligatorio.";
  }

  if (!visitor.firstNameSnapshot.trim()) {
    errors.firstNameSnapshot = "El nombre es obligatorio.";
  }

  if (!visitor.lastNameSnapshot.trim()) {
    errors.lastNameSnapshot = "Los apellidos son obligatorios.";
  }

  return errors;
}

export default function CreatePlannedAccessForm({
  sites,
  actionPath = "/admin/planned-access",
  lockedSiteId,
}: CreatePlannedAccessFormProps) {
  const fetcher = useFetcher<FetcherData>();
  const [open, setOpen] = useState(false);
  const [datePickerResetKey, setDatePickerResetKey] = useState(0);
  const [visitors, setVisitors] = useState<PlannedAccessVisitor[]>([]);
  const [nextVisitorId, setNextVisitorId] = useState(1);
  const [visitorDraft, setVisitorDraft] = useState(getEmptyVisitorDraft);
  const [visitorDraftErrors, setVisitorDraftErrors] =
    useState<VisitorDraftErrors>({});
  const [visitorPopoverOpen, setVisitorPopoverOpen] = useState(false);
  const [localVisitorsError, setLocalVisitorsError] = useState<string | null>(
    null,
  );
  const [legalIdSuggestions, setLegalIdSuggestions] = useState<
    ExternalWorkerListItem[]
  >([]);
  const [showLegalIdSuggestions, setShowLegalIdSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);

  const selectedSiteId = sites[0]?.id;
  const globalError =
    typeof fetcher.data?.errors === "string" ? fetcher.data.errors : null;
  const serverVisitorsErrors = getFieldErrors(fetcher.data?.errors, "persons");
  const visitorsError =
    localVisitorsError ??
    (visitors.length === 0 ? (serverVisitorsErrors?.[0] ?? null) : null);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data || fetcher.data.errors) {
      return;
    }

    setOpen(false);
    setDatePickerResetKey((currentKey) => currentKey + 1);
    setVisitors([]);
    setNextVisitorId(1);
    setVisitorDraft(getEmptyVisitorDraft());
    setVisitorDraftErrors({});
    setVisitorPopoverOpen(false);
    setLocalVisitorsError(null);
    setLegalIdSuggestions([]);
    setShowLegalIdSuggestions(false);
  }, [fetcher.data, fetcher.state]);

  function handleLegalIdChange(value: string) {
    handleVisitorDraftChange("legalIdSnapshot", value);
    handleVisitorDraftChange("externalWorkerId", "");

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setLegalIdSuggestions([]);
      setShowLegalIdSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const params = new URLSearchParams({ q: value });
      const response = await fetch(`/api/external-workers/search?${params}`);
      if (response.ok) {
        const data = (await response.json()) as ExternalWorkerListItem[];
        setLegalIdSuggestions(data);
        setSelectedSuggestionIndex(0);
        setShowLegalIdSuggestions(data.length > 0);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }

  function handleWorkerSuggestionSelect(worker: ExternalWorkerListItem) {
    handleVisitorDraftChange("firstNameSnapshot", worker.firstName);
    handleVisitorDraftChange("lastNameSnapshot", worker.lastName);
    handleVisitorDraftChange("phoneNumber", worker.phoneNumber ?? "");
    handleVisitorDraftChange("legalIdSnapshot", worker.legalId);
    handleVisitorDraftChange("externalWorkerId", worker.id);
    setLegalIdSuggestions([]);
    setShowLegalIdSuggestions(false);
  }

  function handleLegalIdKeyDown(event: React.KeyboardEvent) {
    if (!showLegalIdSuggestions || legalIdSuggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        Math.min(prev + 1, legalIdSuggestions.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedSuggestionIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleWorkerSuggestionSelect(legalIdSuggestions[selectedSuggestionIndex]);
    } else if (event.key === "Escape") {
      setShowLegalIdSuggestions(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsContainerRef.current &&
        !suggestionsContainerRef.current.contains(event.target as Node)
      ) {
        setShowLegalIdSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function resetVisitorState() {
    setDatePickerResetKey((currentKey) => currentKey + 1);
    setVisitors([]);
    setNextVisitorId(1);
    setVisitorDraft(getEmptyVisitorDraft());
    setVisitorDraftErrors({});
    setVisitorPopoverOpen(false);
    setLocalVisitorsError(null);
    setLegalIdSuggestions([]);
    setShowLegalIdSuggestions(false);
  }

  function handleVisitorDraftChange(field: keyof VisitorDraft, value: string) {
    setVisitorDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  function handleAddVisitor() {
    const nextErrors = validateVisitorDraft(visitorDraft);

    if (Object.keys(nextErrors).length > 0) {
      setVisitorDraftErrors(nextErrors);
      return;
    }

    const visitor = normalizeVisitorDraft(visitorDraft);

    setVisitors((currentVisitors) => [
      ...currentVisitors,
      { ...visitor, id: nextVisitorId },
    ]);
    setNextVisitorId((currentId) => currentId + 1);
    setVisitorDraft(getEmptyVisitorDraft());
    setVisitorDraftErrors({});
    setVisitorPopoverOpen(false);
    setLocalVisitorsError(null);
  }

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          resetVisitorState();
        }
      }}
      buttonLabel={
        <>
          <PlusIcon data-icon="inline-start" />
          Nueva solicitud
        </>
      }
      contentClassName="flex max-h-[90vh] w-[94vw] max-w-4xl flex-col overflow-hidden"
      title={<span className="text-2xl font-semibold">Nueva Solicitud de Acceso</span>}
      description="Ingresa la informacion de la visita planificada. Los campos con (*) son obligatorios."
      footer={
        <>
          <AlertDialogCancel variant="destructive">Cancelar</AlertDialogCancel>
          <Button
            type="submit"
            form="create-planned-access"
            disabled={fetcher.state !== "idle" || !sites.length || !visitors.length}
          >
            {fetcher.state === "submitting" ? "Enviando..." : "Enviar"}
          </Button>
        </>
      }
    >
      <fetcher.Form
        id="create-planned-access"
        method="post"
        action={actionPath}
        className="grid min-h-0 gap-x-8 gap-y-5 overflow-y-auto p-2 md:grid-cols-2"
        onSubmit={(event) => {
          if (visitors.length > 0) {
            return;
          }

          event.preventDefault();
          setLocalVisitorsError("Debe agregar al menos un visitante.");
        }}
      >
        {globalError ? (
          <Alert variant="destructive" className="md:col-span-2">
            <AlertTriangleIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        ) : null}
        {!sites.length ? (
          <Alert className="md:col-span-2">
            <AlertTriangleIcon />
            <AlertTitle>No hay centros disponibles</AlertTitle>
            <AlertDescription>
              Crea un centro antes de registrar solicitudes de acceso.
            </AlertDescription>
          </Alert>
        ) : null}
        <FieldWrapper
          label="Centro *"
          htmlFor="siteId"
          errors={getFieldErrors(fetcher.data?.errors, "siteId")}
        >
          {lockedSiteId ? (
            <input type="hidden" name="siteId" value={lockedSiteId} />
          ) : null}
          <Select name="siteId" defaultValue={selectedSiteId} disabled={!sites.length || !!lockedSiteId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Centro para la solicitud..." />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FieldWrapper>
        <FieldWrapper
          label="Empresa *"
          htmlFor="companySnapshot"
          errors={getFieldErrors(fetcher.data?.errors, "companySnapshot")}
        >
          <Input id="companySnapshot" name="companySnapshot" required />
        </FieldWrapper>
        <FieldWrapper
          label="Inicio previsto *"
          htmlFor="expectedStartDatetime"
          errors={getFieldErrors(fetcher.data?.errors, "expectedStartDatetime")}
          className="md:col-span-2"
        >
          <DateTimePicker
            key={`expected-start-${datePickerResetKey}`}
            id="expectedStartDatetime"
            name="expectedStartDatetime"
            className="m-0 w-full"
            required
          />
        </FieldWrapper>
        <FieldWrapper
          label="Fin previsto"
          htmlFor="expectedEndDatetime"
          errors={getFieldErrors(fetcher.data?.errors, "expectedEndDatetime")}
          className="md:col-span-2"
        >
          <DateTimePicker
            key={`expected-end-${datePickerResetKey}`}
            id="expectedEndDatetime"
            name="expectedEndDatetime"
            className="m-0 w-full"
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
        <div className="flex flex-col gap-4 md:col-span-2">
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl font-semibold">Visitantes</h3>
            <Popover open={visitorPopoverOpen} onOpenChange={setVisitorPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Agregar visitante"
                >
                  <PlusIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="w-80 gap-4"
                onOpenAutoFocus={(event) => event.preventDefault()}
              >
                <FieldWrapper
                  label="DNI *"
                  htmlFor="visitor-legal-id"
                  errors={
                    visitorDraftErrors.legalIdSnapshot
                      ? [visitorDraftErrors.legalIdSnapshot]
                      : undefined
                  }
                >
                  <div ref={suggestionsContainerRef} className="relative">
                    <Input
                      id="visitor-legal-id"
                      value={visitorDraft.legalIdSnapshot}
                      onChange={(event) =>
                        handleLegalIdChange(event.currentTarget.value)
                      }
                      onKeyDown={handleLegalIdKeyDown}
                      className="uppercase"
                      aria-invalid={
                        visitorDraftErrors.legalIdSnapshot ? true : undefined
                      }
                      autoComplete="off"
                    />
                    {showLegalIdSuggestions &&
                      legalIdSuggestions.length > 0 && (
                        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                          {legalIdSuggestions.map((worker, index) => (
                            <li
                              key={worker.id}
                              className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm ${
                                index === selectedSuggestionIndex
                                  ? "bg-accent text-accent-foreground"
                                  : "hover:bg-accent/50"
                              }`}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleWorkerSuggestionSelect(worker);
                              }}
                              onMouseEnter={() =>
                                setSelectedSuggestionIndex(index)
                              }
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
                  label="Nombre *"
                  htmlFor="visitor-first-name"
                  errors={
                    visitorDraftErrors.firstNameSnapshot
                      ? [visitorDraftErrors.firstNameSnapshot]
                      : undefined
                  }
                >
                  <Input
                    id="visitor-first-name"
                    value={visitorDraft.firstNameSnapshot}
                    onChange={(event) =>
                      handleVisitorDraftChange(
                        "firstNameSnapshot",
                        event.currentTarget.value,
                      )
                    }
                    aria-invalid={
                      visitorDraftErrors.firstNameSnapshot ? true : undefined
                    }
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Apellidos *"
                  htmlFor="visitor-last-name"
                  errors={
                    visitorDraftErrors.lastNameSnapshot
                      ? [visitorDraftErrors.lastNameSnapshot]
                      : undefined
                  }
                >
                  <Input
                    id="visitor-last-name"
                    value={visitorDraft.lastNameSnapshot}
                    onChange={(event) =>
                      handleVisitorDraftChange(
                        "lastNameSnapshot",
                        event.currentTarget.value,
                      )
                    }
                    aria-invalid={
                      visitorDraftErrors.lastNameSnapshot ? true : undefined
                    }
                  />
                </FieldWrapper>
                <FieldWrapper label="Telefono" htmlFor="visitor-phone-number">
                  <Input
                    id="visitor-phone-number"
                    value={visitorDraft.phoneNumber}
                    onChange={(event) =>
                      handleVisitorDraftChange(
                        "phoneNumber",
                        event.currentTarget.value,
                      )
                    }
                  />
                </FieldWrapper>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVisitorDraft(getEmptyVisitorDraft());
                      setVisitorDraftErrors({});
                      setVisitorPopoverOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="button" size="sm" onClick={handleAddVisitor}>
                    Agregar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {visitorsError ? (
            <p className="text-sm text-destructive">{visitorsError}</p>
          ) : null}
          <div className="flex flex-col gap-3">
            {visitors.length ? (
              visitors.map((visitor, visitorIndex) => {
                const visitorErrors = getPersonErrors(
                  fetcher.data?.errors,
                  visitorIndex,
                );

                return (
                  <div
                    key={visitor.id}
                    className="rounded-md border bg-background p-3 shadow-xs"
                  >
                    <input
                      type="hidden"
                      name={`persons[${visitorIndex}].legalIdSnapshot`}
                      value={visitor.legalIdSnapshot}
                    />
                    <input
                      type="hidden"
                      name={`persons[${visitorIndex}].firstNameSnapshot`}
                      value={visitor.firstNameSnapshot}
                    />
                    <input
                      type="hidden"
                      name={`persons[${visitorIndex}].lastNameSnapshot`}
                      value={visitor.lastNameSnapshot}
                    />
                    <input
                      type="hidden"
                      name={`persons[${visitorIndex}].phoneNumber`}
                      value={visitor.phoneNumber}
                    />
                    {visitor.externalWorkerId ? (
                      <input
                        type="hidden"
                        name={`persons[${visitorIndex}].externalWorkerId`}
                        value={visitor.externalWorkerId}
                      />
                    ) : null}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {getVisitorFullName(visitor)}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          DNI: {visitor.legalIdSnapshot} | Telefono:{" "}
                          {visitor.phoneNumber || "-"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Quitar visitante ${visitorIndex + 1}`}
                        onClick={() => {
                          setVisitors((currentVisitors) =>
                            currentVisitors.filter(
                              (currentVisitor) => currentVisitor.id !== visitor.id,
                            ),
                          );
                        }}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                    {visitorErrors ? (
                      <p className="mt-2 text-sm text-destructive">
                        {visitorErrors[0]}
                      </p>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Agrega visitantes con el boton + para completar la solicitud.
              </div>
            )}
          </div>
        </div>
      </fetcher.Form>
    </AlertDialogContainer>
  );
}
