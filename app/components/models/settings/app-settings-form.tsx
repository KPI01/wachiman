import { useEffect } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Building2Icon, Clock3Icon, SaveIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "~/components/ui/input-group";
import { getActionErrorMessage } from "~/lib/utils/action-errors";
import { getFieldErrors } from "~/lib/utils/zod-errors";
import {
  EARLY_ARRIVAL_TOLERANCE_MINUTES_MAX,
  EARLY_ARRIVAL_TOLERANCE_MINUTES_MIN,
} from "~/lib/schemas/app-settings";

type SettingsData = {
  earlyArrivalToleranceMinutes: number;
  updatedAt: string | Date;
  updatedBy?: { fullName: string; username: string } | null;
  holderLegalName: string | null;
  holderTaxId: string | null;
  holderFiscalAddress: string | null;
};

export default function AppSettingsForm({ settings }: { settings: SettingsData }) {
  const fetcher = useFetcher<{ success?: boolean; errors?: unknown }>();
  const isPending = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.success) {
      toast.success("Configuración guardada correctamente");
    } else if (fetcher.data.errors) {
      toast.error(getActionErrorMessage(fetcher.data.errors));
    }
  }, [fetcher.data, fetcher.state]);

  const updatedAt = new Date(settings.updatedAt);
  const errors = fetcher.data?.errors;
  const earlyArrivalErrors = getFieldErrors(errors, "earlyArrivalToleranceMinutes");
  const legalNameErrors = getFieldErrors(errors, "holderLegalName");
  const taxIdErrors = getFieldErrors(errors, "holderTaxId");
  const fiscalAddressErrors = getFieldErrors(errors, "holderFiscalAddress");
  const globalError = typeof errors === "string" ? errors : null;

  return (
    <fetcher.Form method="post" className="flex w-full max-w-3xl flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3Icon aria-hidden="true" className="text-primary" />
            Accesos planificados
          </CardTitle>
          <CardDescription>
            Define cuánto tiempo antes de la hora prevista puede registrarse la entrada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field
            data-invalid={earlyArrivalErrors ? "true" : undefined}
            className="max-w-xl"
          >
            <FieldLabel htmlFor="earlyArrivalToleranceMinutes">
              Anticipación permitida para ingreso
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="earlyArrivalToleranceMinutes"
                name="earlyArrivalToleranceMinutes"
                type="number"
                min={EARLY_ARRIVAL_TOLERANCE_MINUTES_MIN}
                max={EARLY_ARRIVAL_TOLERANCE_MINUTES_MAX}
                step="5"
                defaultValue={settings.earlyArrivalToleranceMinutes}
                aria-invalid={Boolean(earlyArrivalErrors)}
                aria-describedby={
                  earlyArrivalErrors
                    ? "early-arrival-help early-arrival-error"
                    : "early-arrival-help"
                }
                required
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>minutos</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription id="early-arrival-help">
              Usa 0 para desactivar la anticipación. El máximo permitido es de 360 minutos.
            </FieldDescription>
            <FieldError id="early-arrival-error" errors={earlyArrivalErrors?.map((message) => ({ message }))} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2Icon aria-hidden="true" className="text-primary" />
            Datos legales de la empresa titular
          </CardTitle>
          <CardDescription>
            Esta información se utilizará en los documentos y registros oficiales de acceso.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field
            data-invalid={legalNameErrors ? "true" : undefined}
            className="sm:col-span-2"
          >
            <FieldLabel htmlFor="holderLegalName">Razón social</FieldLabel>
            <Input
              id="holderLegalName"
              name="holderLegalName"
              defaultValue={settings.holderLegalName ?? ""}
              autoComplete="organization"
              aria-invalid={Boolean(legalNameErrors)}
              aria-describedby={legalNameErrors ? "holder-legal-name-error" : undefined}
              required
            />
            <FieldError id="holder-legal-name-error" errors={legalNameErrors?.map((message) => ({ message }))} />
          </Field>
          <Field data-invalid={taxIdErrors ? "true" : undefined}>
            <FieldLabel htmlFor="holderTaxId">NIF/CIF</FieldLabel>
            <Input
              id="holderTaxId"
              name="holderTaxId"
              defaultValue={settings.holderTaxId ?? ""}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(taxIdErrors)}
              aria-describedby={taxIdErrors ? "holder-tax-id-error" : undefined}
              required
            />
            <FieldError id="holder-tax-id-error" errors={taxIdErrors?.map((message) => ({ message }))} />
          </Field>
          <Field data-invalid={fiscalAddressErrors ? "true" : undefined}>
            <FieldLabel htmlFor="holderFiscalAddress">Domicilio fiscal</FieldLabel>
            <Input
              id="holderFiscalAddress"
              name="holderFiscalAddress"
              defaultValue={settings.holderFiscalAddress ?? ""}
              autoComplete="street-address"
              aria-invalid={Boolean(fiscalAddressErrors)}
              aria-describedby={fiscalAddressErrors ? "holder-fiscal-address-error" : undefined}
              required
            />
            <FieldError id="holder-fiscal-address-error" errors={fiscalAddressErrors?.map((message) => ({ message }))} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          {globalError ? (
            <Alert variant="destructive" className="mb-3">
              <TriangleAlertIcon />
              <AlertTitle>No se pudo guardar</AlertTitle>
              <AlertDescription>{globalError}</AlertDescription>
            </Alert>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Última modificación: {updatedAt.toLocaleString("es-ES")}
            {settings.updatedBy
              ? ` por ${settings.updatedBy.fullName} (${settings.updatedBy.username})`
              : " por la configuración inicial"}
          </p>
        </div>
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          <SaveIcon data-icon="inline-start" />
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
      <Input
        type="hidden"
        name="updatedAt"
        value={updatedAt.toISOString()}
        readOnly
      />
    </fetcher.Form>
  );
}
