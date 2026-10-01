import type { ActionFunctionArgs } from "react-router";
import { AuditLogEntity } from "~/lib/database/audit-log.server";
import { UserEntity } from "~/lib/database/user.server";
import { validateUserRole } from "~/lib/auth.server";
import { validateHashedText } from "~/lib/hash.server";
import {
  createBackupArchive,
  createBackupDownloadResponse,
} from "~/lib/services/backup.server";

function getActionError(error: unknown) {
  const databaseError = error as { code?: string; cause?: { code?: string } } | null;
  const code = databaseError?.code ?? databaseError?.cause?.code;
  if (code === "23505") {
    return "No se pudo generar la copia porque hay datos con valores únicos duplicados.";
  }
  if (databaseError?.cause) {
    return "No se pudo completar la exportación por un error en la base de datos.";
  }
  return error instanceof Error ? error.message : "No se pudo completar la exportación.";
}

function getText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await validateUserRole(request, "ADMIN");

  try {
    const formData = await request.formData();
    const password = getText(formData, "exportCurrentPassword");
    const passwordHash = await UserEntity.getPasswordHashById(user.id);
    if (!passwordHash || !password || !(await validateHashedText(passwordHash, password))) {
      throw new Error("La contraseña actual no es correcta. Vuelve a autenticarte para continuar.");
    }

    const passphrase = getText(formData, "archivePassword");
    if (passphrase !== getText(formData, "archivePasswordConfirm")) {
      throw new Error("Las contraseñas del archivo no coinciden.");
    }

    await AuditLogEntity.create({
      entityType: "Backup",
      entityId: "portable-backup",
      action: "BACKUP_EXPORT_STARTED",
      changedBy: user.id,
      summary: "Se inició una exportación de datos.",
    });
    const result = await createBackupArchive(passphrase);
    await AuditLogEntity.create({
      entityType: "Backup",
      entityId: "portable-backup",
      action: "BACKUP_EXPORTED",
      changedBy: user.id,
      summary: "Se exportó una copia de seguridad cifrada.",
      metadata: { files: result.summary.files },
    });
    return createBackupDownloadResponse(result.archive);
  } catch (error) {
    const message = getActionError(error);
    try {
      await AuditLogEntity.create({
        entityType: "Backup",
        entityId: "portable-backup",
        action: "BACKUP_OPERATION_FAILED",
        changedBy: user.id,
        summary: "Falló una operación de copia de seguridad.",
        metadata: { reason: message.slice(0, 240) },
      });
    } catch {
      // El error original debe seguir visible aunque la base de datos no permita auditarlo.
    }
    return Response.json({ error: message }, { status: 400 });
  }
}
