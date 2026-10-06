import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import {
  Clock3Icon,
  ImageIcon,
  RotateCcwIcon,
  SaveIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "~/components/ui/input-group";
import { useAppConfig } from "~/lib/app-config";
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
  appLogoMimeType: string | null;
  appFaviconMimeType: string | null;
};

export default function AppSettingsForm({ settings }: { settings: SettingsData }) {
  const fetcher = useFetcher<{
    success?: boolean;
    errors?: unknown;
    settings?: { updatedAt: string | Date };
  }>();
  const { appLogo, appFavicon, appLogoDefault, appFaviconDefault } = useAppConfig();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [resetLogo, setResetLogo] = useState(false);
  const [resetFavicon, setResetFavicon] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const isPending = fetcher.state !== "idle";

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!faviconFile) {
      setFaviconPreview(null);
      return;
    }
    const url = URL.createObjectURL(faviconFile);
    setFaviconPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [faviconFile]);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.success) {
      toast.success("Configuración guardada correctamente");
      setLogoFile(null);
      setFaviconFile(null);
      setResetLogo(false);
      setResetFavicon(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
      if (faviconInputRef.current) faviconInputRef.current.value = "";
    } else if (fetcher.data.errors) {
      toast.error(getActionErrorMessage(fetcher.data.errors));
    }
  }, [fetcher.data, fetcher.state]);

  const updatedAt = new Date(fetcher.data?.settings?.updatedAt ?? settings.updatedAt);
  const errors = fetcher.data?.errors;
  const earlyArrivalErrors = getFieldErrors(errors, "earlyArrivalToleranceMinutes");
  const globalError = typeof errors === "string" ? errors : null;

  function toggleLogoReset() {
    setLogoFile(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    setResetLogo((value) => !value);
  }

  function toggleFaviconReset() {
    setFaviconFile(null);
    if (faviconInputRef.current) faviconInputRef.current.value = "";
    setResetFavicon((value) => !value);
  }

  return (
    <fetcher.Form
      method="post"
      encType="multipart/form-data"
      className="flex w-full max-w-3xl flex-col gap-5"
    >
      <input type="hidden" name="resetAppLogo" value={resetLogo ? "true" : "false"} />
      <input type="hidden" name="resetAppFavicon" value={resetFavicon ? "true" : "false"} />

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
            <FieldError
              id="early-arrival-error"
              errors={earlyArrivalErrors?.map((message) => ({ message }))}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon aria-hidden="true" className="text-primary" />
            Identidad visual
          </CardTitle>
          <CardDescription>
            Personaliza el logotipo de la aplicación y el icono que aparece en la pestaña del navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="appLogoFile">Logo de la aplicación</FieldLabel>
              <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
                <div className="flex min-h-20 w-44 shrink-0 items-center justify-center rounded-md bg-muted/40 p-3">
                  <img
                    src={logoPreview ?? (resetLogo ? appLogoDefault : appLogo)}
                    alt="Vista previa del logo de la aplicación"
                    className="max-h-16 max-w-full object-contain"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {logoFile?.name ?? (settings.appLogoMimeType ? "Imagen personalizada" : "Logo predeterminado")}
                    </p>
                    <Badge variant="outline">
                      {logoFile
                        ? "Pendiente de guardar"
                        : settings.appLogoMimeType && !resetLogo
                          ? "Personalizado"
                          : "Predeterminado"}
                    </Badge>
                  </div>
                  <Input
                    ref={logoInputRef}
                    id="appLogoFile"
                    name="appLogoFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    disabled={isPending}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0] ?? null;
                      setLogoFile(file);
                      if (file) setResetLogo(false);
                    }}
                  />
                  <FieldDescription>
                    PNG, JPEG, WebP o SVG; máximo 512 KiB.
                  </FieldDescription>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    disabled={isPending || (!settings.appLogoMimeType && !logoFile && !resetLogo)}
                    onClick={toggleLogoReset}
                  >
                    <RotateCcwIcon data-icon="inline-start" />
                    {resetLogo ? "Cancelar restauración" : "Restaurar predeterminado"}
                  </Button>
                </div>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="appFaviconFile">Icono del navegador (favicon)</FieldLabel>
              <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-md bg-muted/40 p-3">
                  <img
                    src={faviconPreview ?? (resetFavicon ? appFaviconDefault : appFavicon)}
                    alt="Vista previa del favicon"
                    className="max-h-14 max-w-14 object-contain"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {faviconFile?.name ?? (settings.appFaviconMimeType ? "Imagen personalizada" : "Favicon predeterminado")}
                    </p>
                    <Badge variant="outline">
                      {faviconFile
                        ? "Pendiente de guardar"
                        : settings.appFaviconMimeType && !resetFavicon
                          ? "Personalizado"
                          : "Predeterminado"}
                    </Badge>
                  </div>
                  <Input
                    ref={faviconInputRef}
                    id="appFaviconFile"
                    name="appFaviconFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    disabled={isPending}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0] ?? null;
                      setFaviconFile(file);
                      if (file) setResetFavicon(false);
                    }}
                  />
                  <FieldDescription>
                    PNG, JPEG, WebP o SVG; máximo 512 KiB.
                  </FieldDescription>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    disabled={isPending || (!settings.appFaviconMimeType && !faviconFile && !resetFavicon)}
                    onClick={toggleFaviconReset}
                  >
                    <RotateCcwIcon data-icon="inline-start" />
                    {resetFavicon ? "Cancelar restauración" : "Restaurar predeterminado"}
                  </Button>
                </div>
              </div>
            </Field>
          </FieldGroup>
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
    </fetcher.Form>
  );
}
