import { AlertTriangleIcon, PencilIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import AlertDialogContainer, {
  AlertDialogCancel,
} from "~/components/containers/alert-dialog-container";
import CompanyCombobox from "~/components/models/company/company-combobox";
import ExternalWorkerCombobox from "~/components/models/external-worker/external-worker-combobox";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { DateTimePicker } from "~/components/ui/date-time-picker";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import FieldWrapper from "~/components/ui/wrappers/field-wrapper";
import type { AccessLogListItem } from "~/lib/database/access-log.server";
import type { ExternalWorkerListItem } from "~/lib/database/external-worker.server";
import { formatTimestamp } from "~/lib/utils";
import { getFieldErrors } from "~/lib/utils/zod-errors";

type EditStep = "warning" | "form" | "confirmation";

type FetcherData = {
  success?: boolean;
  errors?: unknown;
};

type FormValues = {
  companyNameSnapshot: string;
  firstNameSnapshot: string;
  middleNameSnapshot: string;
  lastNameSnapshot: string;
  secondLastNameSnapshot: string;
  phoneNumber: string;
  legalIdSnapshot: string;
  visitReason: string;
};

function timestampVersion(accessLog: AccessLogListItem) {
  return {
    entry: new Date(accessLog.entryTimestamp).toISOString(),
    exit: accessLog.exitTimestamp
      ? new Date(accessLog.exitTimestamp).toISOString()
      : "",
  };
}

function initialValues(accessLog: AccessLogListItem): FormValues {
  return {
    companyNameSnapshot: accessLog.companyNameSnapshot,
    firstNameSnapshot: accessLog.firstNameSnapshot,
    middleNameSnapshot: accessLog.middleNameSnapshot ?? "",
    lastNameSnapshot: accessLog.lastNameSnapshot,
    secondLastNameSnapshot: accessLog.secondLastNameSnapshot ?? "",
    phoneNumber: accessLog.phoneNumber ?? "",
    legalIdSnapshot: accessLog.legalIdSnapshot,
    visitReason: accessLog.visitReason,
  };
}

function timestampLabel(value: Date | null) {
  return value
    ? formatTimestamp({ date: value, template: "dd/MM/yyyy HH:mm" })
    : "Sin salida";
}

export default function EditAccessLog({
  accessLog,
}: {
  accessLog: AccessLogListItem;
}) {
  const fetcher = useFetcher<FetcherData>();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<EditStep>("warning");
  const [values, setValues] = useState(() => initialValues(accessLog));
  const [entryTimestamp, setEntryTimestamp] = useState(
    () => new Date(accessLog.entryTimestamp),
  );
  const [exitTimestamp, setExitTimestamp] = useState<Date | null>(() =>
    accessLog.exitTimestamp ? new Date(accessLog.exitTimestamp) : null,
  );
  const [externalWorkerId, setExternalWorkerId] = useState<string | null>(
    accessLog.externalWorkerId,
  );
  const [expectedTimestamps, setExpectedTimestamps] = useState(() =>
    timestampVersion(accessLog),
  );
  const formRef = useRef<HTMLFormElement>(null);
  const formId = `edit-access-log-${accessLog.id}`;
  const isSubmitting = fetcher.state !== "idle";
  const globalError =
    typeof fetcher.data?.errors === "string" ? fetcher.data.errors : null;

  function resetForm() {
    setStep("warning");
    setValues(initialValues(accessLog));
    setEntryTimestamp(new Date(accessLog.entryTimestamp));
    setExitTimestamp(
      accessLog.exitTimestamp ? new Date(accessLog.exitTimestamp) : null,
    );
    setExternalWorkerId(accessLog.externalWorkerId);
    setExpectedTimestamps(timestampVersion(accessLog));
  }

  function updateIdentity(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setExternalWorkerId(null);
  }

  function selectWorker(worker: ExternalWorkerListItem) {
    setExternalWorkerId(worker.id);
    setValues((current) => ({
      ...current,
      firstNameSnapshot: worker.firstName,
      middleNameSnapshot: worker.middleName ?? "",
      lastNameSnapshot: worker.lastName,
      secondLastNameSnapshot: worker.secondLastName ?? "",
      phoneNumber: worker.phoneNumber ?? "",
      legalIdSnapshot: worker.legalId,
      companyNameSnapshot: worker.company?.name ?? current.companyNameSnapshot,
    }));
  }

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;

    if (fetcher.data.success) {
      setOpen(false);
      resetForm();
    } else if (fetcher.data.errors) {
      setStep("form");
    }
  }, [fetcher.data, fetcher.state]);

  const title =
    step === "warning"
      ? "Advertencia de edición"
      : step === "form"
        ? "Editar registro de acceso"
        : "Confirmar cambios";

  const description =
    step === "warning"
      ? "Vas a modificar un registro histórico asociado a un ingreso firmado. Los cambios quedarán identificados en la auditoría."
      : step === "form"
        ? "Actualiza únicamente los datos que necesiten corrección. Los campos con (*) son obligatorios."
        : "Revisa los datos. Esta es la última confirmación antes de guardar la modificación.";

  return (
    <AlertDialogContainer
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        setOpen(nextOpen);
        if (nextOpen) resetForm();
      }}
      buttonLabel={
        <>
          <PencilIcon />
          <span className="sr-only">Editar registro de acceso</span>
        </>
      }
      buttonVariant="ghost"
      buttonSize="icon"
      title={title}
      description={description}
      contentClassName="flex max-h-[90vh] w-[94vw] max-w-4xl flex-col overflow-hidden"
      footer={
        <>
          <AlertDialogCancel variant="outline" disabled={isSubmitting}>
            Cancelar
          </AlertDialogCancel>
          {step === "warning" ? (
            <Button type="button" onClick={() => setStep("form")}>
              Entiendo, editar
            </Button>
          ) : step === "form" ? (
            <Button
              type="button"
              onClick={() => {
                if (formRef.current?.reportValidity()) {
                  setStep("confirmation");
                }
              }}
            >
              Revisar cambios
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setStep("form")}
              >
                Volver
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (formRef.current) {
                    fetcher.submit(formRef.current, {
                      method: "patch",
                      action: `/access-log/${accessLog.id}`,
                    });
                  }
                }}
              >
                {isSubmitting ? "Guardando..." : "Confirmar y guardar"}
              </Button>
            </>
          )}
        </>
      }
    >
      {step === "warning" ? (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Modificación de datos históricos</AlertTitle>
          <AlertDescription>
            Verifica la documentación original antes de continuar. Editar este
            registro no cambia la ficha maestra del trabajador ni una solicitud
            planificada vinculada.
          </AlertDescription>
        </Alert>
      ) : null}

      <fetcher.Form
        ref={formRef}
        id={formId}
        method="patch"
        action={`/access-log/${accessLog.id}`}
        className={step === "form" ? "grid min-h-0 gap-4 overflow-y-auto p-2 md:grid-cols-2" : "hidden"}
      >
        <input
          type="hidden"
          name="externalWorkerId"
          value={externalWorkerId ?? ""}
        />
        <input
          type="hidden"
          name="entryTimestamp"
          value={entryTimestamp.toISOString()}
        />
        <input
          type="hidden"
          name="exitTimestamp"
          value={exitTimestamp?.toISOString() ?? ""}
        />
        <input
          type="hidden"
          name="expectedEntryTimestamp"
          value={expectedTimestamps.entry}
        />
        <input
          type="hidden"
          name="expectedExitTimestamp"
          value={expectedTimestamps.exit}
        />
        <FieldWrapper
          label="Fecha y hora de ingreso *"
          htmlFor={`${formId}-entry`}
          errors={getFieldErrors(fetcher.data?.errors, "entryTimestamp")}
        >
          <DateTimePicker
            id={`${formId}-entry`}
            value={entryTimestamp}
            onChange={(value) => value && setEntryTimestamp(value)}
            className="m-0 w-full"
            required
          />
        </FieldWrapper>
        <FieldWrapper
          label="Fecha y hora de salida"
          htmlFor={`${formId}-exit`}
          errors={getFieldErrors(fetcher.data?.errors, "exitTimestamp")}
        >
          <div className="flex items-center gap-2">
            <DateTimePicker
              id={`${formId}-exit`}
              value={exitTimestamp}
              onChange={(value) => setExitTimestamp(value ?? null)}
              className="m-0 min-w-0 flex-1"
            />
            {exitTimestamp ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setExitTimestamp(null)}
              >
                Quitar
              </Button>
            ) : null}
          </div>
        </FieldWrapper>
        <FieldWrapper
          className="md:col-span-2"
          label="Buscar persona por nombre o documento"
          htmlFor={`${formId}-worker-search`}
        >
          <ExternalWorkerCombobox
            id={`${formId}-worker-search`}
            searchBy="name"
            onSelect={selectWorker}
            placeholder="Escribe al menos dos caracteres..."
          />
        </FieldWrapper>
        <FieldWrapper
          label="DNI/NIE *"
          htmlFor={`${formId}-legal-id`}
          errors={getFieldErrors(fetcher.data?.errors, "legalIdSnapshot")}
        >
          <Input
            id={`${formId}-legal-id`}
            name="legalIdSnapshot"
            className="uppercase"
            value={values.legalIdSnapshot}
            onChange={(event) =>
              updateIdentity("legalIdSnapshot", event.currentTarget.value)
            }
            required
          />
        </FieldWrapper>
        <FieldWrapper
          label="Teléfono"
          htmlFor={`${formId}-phone`}
          errors={getFieldErrors(fetcher.data?.errors, "phoneNumber")}
        >
          <Input
            id={`${formId}-phone`}
            name="phoneNumber"
            value={values.phoneNumber}
            onChange={(event) =>
              updateIdentity("phoneNumber", event.currentTarget.value)
            }
          />
        </FieldWrapper>
        <FieldWrapper
          label="Nombre *"
          htmlFor={`${formId}-first-name`}
          errors={getFieldErrors(fetcher.data?.errors, "firstNameSnapshot")}
        >
          <Input
            id={`${formId}-first-name`}
            name="firstNameSnapshot"
            value={values.firstNameSnapshot}
            onChange={(event) =>
              updateIdentity("firstNameSnapshot", event.currentTarget.value)
            }
            required
          />
        </FieldWrapper>
        <FieldWrapper
          label="Segundo nombre"
          htmlFor={`${formId}-middle-name`}
          errors={getFieldErrors(fetcher.data?.errors, "middleNameSnapshot")}
        >
          <Input
            id={`${formId}-middle-name`}
            name="middleNameSnapshot"
            value={values.middleNameSnapshot}
            onChange={(event) =>
              updateIdentity("middleNameSnapshot", event.currentTarget.value)
            }
          />
        </FieldWrapper>
        <FieldWrapper
          label="Apellido *"
          htmlFor={`${formId}-last-name`}
          errors={getFieldErrors(fetcher.data?.errors, "lastNameSnapshot")}
        >
          <Input
            id={`${formId}-last-name`}
            name="lastNameSnapshot"
            value={values.lastNameSnapshot}
            onChange={(event) =>
              updateIdentity("lastNameSnapshot", event.currentTarget.value)
            }
            required
          />
        </FieldWrapper>
        <FieldWrapper
          label="Segundo apellido"
          htmlFor={`${formId}-second-last-name`}
          errors={getFieldErrors(fetcher.data?.errors, "secondLastNameSnapshot")}
        >
          <Input
            id={`${formId}-second-last-name`}
            name="secondLastNameSnapshot"
            value={values.secondLastNameSnapshot}
            onChange={(event) =>
              updateIdentity("secondLastNameSnapshot", event.currentTarget.value)
            }
          />
        </FieldWrapper>
        <FieldWrapper
          label="Empresa *"
          htmlFor={`${formId}-company`}
          errors={getFieldErrors(fetcher.data?.errors, "companyNameSnapshot")}
        >
          <CompanyCombobox
            id={`${formId}-company`}
            name="companyNameSnapshot"
            value={values.companyNameSnapshot}
            onValueChange={(value) =>
              setValues((current) => ({
                ...current,
                companyNameSnapshot: value,
              }))
            }
            required
          />
        </FieldWrapper>
        <FieldWrapper
          className="md:col-span-2"
          label="Motivo de la visita *"
          htmlFor={`${formId}-reason`}
          errors={getFieldErrors(fetcher.data?.errors, "visitReason")}
        >
          <Textarea
            id={`${formId}-reason`}
            name="visitReason"
            value={values.visitReason}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                visitReason: event.currentTarget.value,
              }))
            }
            required
          />
        </FieldWrapper>
        {globalError ? (
          <Alert variant="destructive" className="md:col-span-2">
            <AlertTriangleIcon />
            <AlertTitle>No se pudo guardar</AlertTitle>
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        ) : null}
      </fetcher.Form>

      {step === "confirmation" ? (
        <div className="grid gap-3 overflow-y-auto rounded-md border p-4 text-sm md:grid-cols-2">
          <div><span className="font-medium">Ingreso:</span> {timestampLabel(entryTimestamp)}</div>
          <div><span className="font-medium">Salida:</span> {timestampLabel(exitTimestamp)}</div>
          <div><span className="font-medium">Documento:</span> {values.legalIdSnapshot.toUpperCase()}</div>
          <div><span className="font-medium">Persona:</span> {[values.firstNameSnapshot, values.middleNameSnapshot, values.lastNameSnapshot, values.secondLastNameSnapshot].filter(Boolean).join(" ")}</div>
          <div><span className="font-medium">Teléfono:</span> {values.phoneNumber || "-"}</div>
          <div><span className="font-medium">Empresa:</span> {values.companyNameSnapshot}</div>
          <div className="md:col-span-2"><span className="font-medium">Motivo:</span> {values.visitReason}</div>
          <Alert variant="destructive" className="md:col-span-2">
            <AlertTriangleIcon />
            <AlertTitle>Confirmación final</AlertTitle>
            <AlertDescription>
              Al guardar, esta corrección quedará atribuida a tu usuario y se
              registrarán los valores anteriores y nuevos en la auditoría.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}
    </AlertDialogContainer>
  );
}
