import { useEffect } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { getActionErrorMessage } from "~/lib/utils/action-errors";
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

  return (
    <fetcher.Form method="post">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Accesos planificados</CardTitle>
          <CardDescription>
            Define cuánto tiempo antes de la hora prevista puede registrarse la entrada.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
          <FieldLabel htmlFor="earlyArrivalToleranceMinutes">
              Anticipación permitida para ingreso
            </FieldLabel>
            <Input
              id="earlyArrivalToleranceMinutes"
              name="earlyArrivalToleranceMinutes"
              type="number"
              min={EARLY_ARRIVAL_TOLERANCE_MINUTES_MIN}
              max={EARLY_ARRIVAL_TOLERANCE_MINUTES_MAX}
              step="5"
              defaultValue={settings.earlyArrivalToleranceMinutes}
              aria-invalid={Boolean(fetcher.data?.errors)}
              required
            />
            <FieldDescription>
              Usa 0 para desactivar la anticipación. El máximo permitido es de 360 minutos.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="holderLegalName">Razón social de la empresa titular</FieldLabel>
            <Input id="holderLegalName" name="holderLegalName" defaultValue={settings.holderLegalName ?? ""} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="holderTaxId">NIF/CIF de la empresa titular</FieldLabel>
            <Input id="holderTaxId" name="holderTaxId" defaultValue={settings.holderTaxId ?? ""} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="holderFiscalAddress">Domicilio fiscal</FieldLabel>
            <Input id="holderFiscalAddress" name="holderFiscalAddress" defaultValue={settings.holderFiscalAddress ?? ""} required />
          </Field>
          <Input
            type="hidden"
            name="updatedAt"
            value={updatedAt.toISOString()}
            readOnly
          />
          {fetcher.data?.errors ? (
            <p className="text-sm text-destructive" role="alert">
              {getActionErrorMessage(fetcher.data.errors)}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Última modificación: {updatedAt.toLocaleString("es-ES")}
            {settings.updatedBy
              ? ` por ${settings.updatedBy.fullName} (${settings.updatedBy.username})`
              : " por la configuración inicial"}
          </p>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </CardFooter>
      </Card>
    </fetcher.Form>
  );
}
