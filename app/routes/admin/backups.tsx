import { useFetcher, useNavigation } from "react-router";
import { useState, type FormEvent } from "react";
import type { Route } from "./+types/backups";
import { validateUserRole } from "~/lib/auth.server";
import {
  decryptBackupArchive,
  getBackupFileName,
  importBackupPayload,
  inspectBackupArchive,
  recordBackupAudit,
  verifyBackupReauthentication,
} from "~/lib/services/backup.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { LoaderCircleIcon } from "lucide-react";

const MAX_UPLOAD_BYTES = 512 * 1024 * 1024;

export async function loader({ request }: Route.LoaderArgs) {
  return validateUserRole(request, "ADMIN");
}

function getText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getActionError(error: unknown) {
  const databaseError = error as { code?: string; cause?: { code?: string } } | null;
  const code = databaseError?.code ?? databaseError?.cause?.code;
  if (code === "23505") {
    return "La copia entra en conflicto con un valor único que ya existe en esta instalación. No se aplicaron cambios.";
  }
  if (code === "23503") {
    return "La copia contiene relaciones que no se pueden restaurar. No se aplicaron cambios.";
  }
  return error instanceof Error ? error.message : "No se pudo completar la operación de respaldo.";
}

export async function action({ request }: Route.ActionArgs) {
  const user = await validateUserRole(request, "ADMIN");
  const formData = await request.formData();
  const intent = getText(formData, "intent");

  try {
    const currentPassword = getText(formData, `${intent}CurrentPassword`);
    if (!(await verifyBackupReauthentication(user.id, currentPassword))) {
      throw new Error("La contraseña actual no es correcta. Vuelve a autenticarte para continuar.");
    }

    if (intent === "preview" || intent === "import") {
      const uploaded = formData.get("backupFile");
      const file = uploaded instanceof File ? getBackupFileName(uploaded) : null;
      if (!file) throw new Error("Selecciona un archivo de respaldo.");
      if (file.size > MAX_UPLOAD_BYTES) throw new Error("El archivo supera el tamaño máximo permitido.");
      const buffer = Buffer.from(await file.arrayBuffer());
      const passphrase = getText(formData, "archivePassword");

      if (intent === "preview") {
        const { summary } = await inspectBackupArchive(buffer, passphrase);
        return { intent, summary };
      }

      if (getText(formData, "confirmation") !== "IMPORTAR") {
        throw new Error("Escribe IMPORTAR para confirmar la restauración.");
      }
      const payload = await decryptBackupArchive(buffer, passphrase);
      const result = await importBackupPayload(payload, user.id);
      return { intent, success: true, result };
    }

    throw new Error("La operación de respaldo solicitada no es válida.");
  } catch (error) {
    const message = getActionError(error);
    try {
      await recordBackupAudit(user.id, "BACKUP_OPERATION_FAILED", "Falló una operación de copia de seguridad.", { reason: message.slice(0, 240) });
    } catch {
      // El error original debe seguir visible aunque la base de datos no permita auditarlo.
    }
    return { intent, error: message };
  }
}

function PasswordField({ name, label, required = true }: { name: string; label: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium" htmlFor={name}>
      {label}
      <Input id={name} name={name} type="password" autoComplete="current-password" required={required} />
    </label>
  );
}

function Summary({ summary }: { summary: {
  createdAt: string;
  tables: Record<string, number>;
  files: number;
  totalFileBytes: number;
} }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 text-sm">
      <p className="font-medium">Respaldo válido · {new Date(summary.createdAt).toLocaleString("es-ES")}</p>
      <p className="mt-1 text-muted-foreground">
        {Object.values(summary.tables).reduce((total, count) => total + count, 0)} registros en {Object.keys(summary.tables).length} tablas;
        {" "}{summary.files} archivos ({(summary.totalFileBytes / 1024 / 1024).toFixed(2)} MB).
      </p>
    </div>
  );
}

export default function AdminBackups({ actionData: formData }: Route.ComponentProps) {
  const previewFetcher = useFetcher<typeof action>();
  const navigation = useNavigation();
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const result = previewFetcher.data;
  const formError = formData && typeof formData === "object" && "error" in formData
    ? formData.error
    : undefined;

  async function handleExport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setExportError(null);
    setIsExporting(true);
    const exportForm = event.currentTarget;

    try {
      const response = await fetch(exportForm.action, {
        method: "POST",
        body: new FormData(exportForm),
        credentials: "same-origin",
      });
      const contentType = response.headers.get("Content-Type") || "";
      if (!response.ok || !contentType.includes("application/vnd.wachiman.backup+json")) {
        const result: unknown = await response.json().catch(() => null);
        const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
          ? result.error
          : "La sesión caducó o no se pudo generar el archivo. Vuelve a iniciar sesión e inténtalo de nuevo.";
        setExportError(message);
        return;
      }

      const archiveUrl = URL.createObjectURL(await response.blob());
      const fileName = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1]
        ?? "wachiman-respaldo.backup";
      const downloadLink = document.createElement("a");
      downloadLink.href = archiveUrl;
      downloadLink.download = fileName;
      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(archiveUrl), 1_000);
    } catch {
      setExportError("No se pudo completar la exportación. Comprueba la conexión e inténtalo de nuevo.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="max-w-3xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Copias de seguridad</h1>
        <p className="text-muted-foreground">
          Exporta o restaura todos los registros, la auditoría, los documentos adjuntos y los archivos de marca.
          El archivo se cifra con una contraseña independiente.
        </p>
      </header>

      {result && "error" in result && result.error ? (
        <Alert variant="destructive"><AlertTitle>No se completó la operación</AlertTitle><AlertDescription>{result.error}</AlertDescription></Alert>
      ) : null}
      {formError ? (
        <Alert variant="destructive"><AlertTitle>No se completó la importación</AlertTitle><AlertDescription>{formError}</AlertDescription></Alert>
      ) : null}
      {exportError ? (
        <Alert variant="destructive"><AlertTitle>No se completó la exportación</AlertTitle><AlertDescription>{exportError}</AlertDescription></Alert>
      ) : null}
      {result && "success" in result && result.success ? (
        <Alert><AlertTitle>Restauración completada</AlertTitle><AlertDescription>Los registros del archivo se aplicaron y la auditoría conserva el resultado.</AlertDescription></Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Exportar datos</CardTitle>
            <CardDescription>Guarda el archivo descargado en una ubicación segura distinta del servidor.</CardDescription>
          </CardHeader>
          <CardContent>
            <form method="post" action="/admin/backups/export" onSubmit={handleExport} className="grid gap-4">
              <PasswordField name="exportCurrentPassword" label="Contraseña actual de tu cuenta" />
              <label className="grid gap-2 text-sm font-medium" htmlFor="exportArchivePassword">
                Contraseña del archivo (mínimo 12 caracteres)
                <Input id="exportArchivePassword" name="archivePassword" type="password" autoComplete="new-password" minLength={12} required />
              </label>
              <label className="grid gap-2 text-sm font-medium" htmlFor="exportArchivePasswordConfirm">
                Repite la contraseña del archivo
                <Input id="exportArchivePasswordConfirm" name="archivePasswordConfirm" type="password" autoComplete="new-password" minLength={12} required />
              </label>
              <Button type="submit" disabled={navigation.state !== "idle" || isExporting}>
                {isExporting ? <><LoaderCircleIcon className="animate-spin" />Preparando copia cifrada…</> : "Descargar copia cifrada"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Importar datos</CardTitle>
            <CardDescription>
              Primero valida el archivo y revisa su resumen. Los datos con el mismo ID se actualizan; los registros exclusivos del servidor se conservan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <previewFetcher.Form method="post" encType="multipart/form-data" className="grid gap-4">
              <input type="hidden" name="intent" value="preview" />
              <label className="grid gap-2 text-sm font-medium" htmlFor="previewBackupFile">
                Archivo de respaldo
                <Input id="previewBackupFile" name="backupFile" type="file" accept=".backup,application/vnd.wachiman.backup+json" required />
              </label>
              <label className="grid gap-2 text-sm font-medium" htmlFor="previewArchivePassword">
                Contraseña del archivo
                <Input id="previewArchivePassword" name="archivePassword" type="password" autoComplete="current-password" minLength={12} required />
              </label>
              <PasswordField name="previewCurrentPassword" label="Contraseña actual de tu cuenta" />
              <Button type="submit" variant="outline" disabled={previewFetcher.state !== "idle"}>
                {previewFetcher.state !== "idle" ? <><LoaderCircleIcon className="animate-spin" />Validando archivo…</> : "Validar y mostrar resumen"}
              </Button>
            </previewFetcher.Form>

            {result && "summary" in result && result.summary ? (
              <>
                <Summary summary={result.summary} />
                <previewFetcher.Form method="post" encType="multipart/form-data" className="grid gap-4 border-t pt-5">
                  <input type="hidden" name="intent" value="import" />
                  <label className="grid gap-2 text-sm font-medium" htmlFor="importBackupFile">
                    Selecciona de nuevo el mismo archivo para aplicarlo
                    <Input id="importBackupFile" name="backupFile" type="file" accept=".backup,application/vnd.wachiman.backup+json" required />
                  </label>
                  <label className="grid gap-2 text-sm font-medium" htmlFor="importArchivePassword">
                    Contraseña del archivo
                    <Input id="importArchivePassword" name="archivePassword" type="password" autoComplete="current-password" minLength={12} required />
                  </label>
                  <PasswordField name="importCurrentPassword" label="Contraseña actual de tu cuenta" />
                  <label className="grid gap-2 text-sm font-medium" htmlFor="importConfirmation">
                    Para confirmar, escribe IMPORTAR
                    <Input id="importConfirmation" name="confirmation" autoComplete="off" required />
                  </label>
                  <Button type="submit" variant="destructive" disabled={previewFetcher.state !== "idle"}>
                    {previewFetcher.state !== "idle" ? <><LoaderCircleIcon className="animate-spin" />Restaurando datos…</> : "Importar y combinar datos"}
                  </Button>
                </previewFetcher.Form>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
