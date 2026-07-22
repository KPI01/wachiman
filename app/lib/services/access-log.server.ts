import z from "zod";
import {
  createAccessLogSchema,
  markAccessLogExitSchema,
  updateAccessLogSchema,
} from "../schemas/access-log";
import { UserEntity } from "../database/user.server";
import {
  AccessLogEntity,
  type GetAccessLogsInput,
} from "../database/access-log.server";
import { encryptValue } from "../crypt.server";
import { ExternalWorkerEntity } from "../database/external-worker.server";

export type AccessLogStatus = "INSIDE" | "OUTSIDE";

export type GetManyAccessLogsInput = GetAccessLogsInput & {
  status?: AccessLogStatus;
};

async function isPersonAlreadyInside(legalId: string, siteId: string) {
  return (await AccessLogEntity.findOpenByLegalIdInSite(legalId, siteId)) !== null;
}

export async function getManyAccessLogs(input?: GetManyAccessLogsInput) {
  if (!input) {
    return await AccessLogEntity.findMany();
  }

  const { status, ...entityInput } = input;

  const exitTimestamp =
    status === "INSIDE"
      ? null
      : status === "OUTSIDE"
        ? { not: null as null }
        : undefined;

  return await AccessLogEntity.findMany({
    ...entityInput,
    ...(exitTimestamp !== undefined ? { exitTimestamp } : {}),
  });
}

type CreateAccessLogOptions = {
  authorUsername: string;
  lockedSiteId?: string;
};

type CreateAccessLogInputType = {
  data: z.infer<typeof createAccessLogSchema>;
  siteId: string;
  createdById: string;
};
async function buildCreateAccessLogInput({
  data,
  createdById,
  siteId,
}: CreateAccessLogInputType) {
  const {
    vehiclePlateSnapshot,
    vehicleBrandSnapshot,
    vehicleModelSnapshot,
    vehicleTypeSnapshot,
    entrySignaturePayload,
    ...accessLogData
  } = data;

  return {
    ...accessLogData,
    siteId,
    createdById,
    entrySignatureEnvelope: await encryptValue(JSON.stringify(entrySignaturePayload)),
    vehicle: data.withVehicle
      ? {
          typeSnapshot: vehicleTypeSnapshot ?? "",
          brandSnapshot: vehicleBrandSnapshot,
          modelSnapshot: vehicleModelSnapshot,
          plateSnapshot: vehiclePlateSnapshot ?? "",
        }
      : undefined,
  };
}

export async function createAccessLog(
  input: Record<string, unknown>,
  options: CreateAccessLogOptions,
) {
  const parsed = await createAccessLogSchema.safeParseAsync(input);

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const data = parsed.data;
  const createdBy = await UserEntity.getByUsername(options.authorUsername);

  if (!createdBy) {
    return { success: false, errors: "unauthorized" };
  }

  const siteId = options.lockedSiteId ?? data.siteId;

  const personIsAlreadyInside = await isPersonAlreadyInside(
    data.legalIdSnapshot,
    siteId,
  );

  if (personIsAlreadyInside) {
    return {
      success: false,
      errors:
        "Esta persona ya se encuentra registrada dentro del centro. No se puede registrar otro acceso para esta persona.",
    };
  }

  await AccessLogEntity.create(
    await buildCreateAccessLogInput({ data, siteId, createdById: createdBy.id }),
  );

  return { success: true };
}

type MarkAccessLogExitOptions = {
  authorUsername: string;
  siteId?: string;
};

export async function markAccessLogExit(
  input: Record<string, unknown>,
  accessLogId: string,
  options: MarkAccessLogExitOptions,
) {
  const parsed = await markAccessLogExitSchema.safeParseAsync(input);

  if (!parsed.success) {
    return { success: false, errors: z.treeifyError(parsed.error) };
  }

  const data = parsed.data;
  const exitRecordedBy = await UserEntity.getByUsername(options.authorUsername);

  if (!exitRecordedBy) {
    return { success: false, errors: "unauthorized" };
  }

  const wasExitRecorded = await AccessLogEntity.markExit({
    accessLogId,
    exitSignatureEnvelope: await encryptValue(
      JSON.stringify(data.exitSignaturePayload),
    ),
    exitRecordedById: exitRecordedBy.id,
    siteId: options.siteId,
  });

  if (!wasExitRecorded) {
    return { success: false, errors: "conflict" };
  }

  return { success: true };
}

type UpdateAccessLogOptions = {
  authorUsername: string;
  lockedSiteId?: string;
};

const editableSnapshot = (accessLog: {
  entryTimestamp: Date;
  exitTimestamp: Date | null;
  companyNameSnapshot: string;
  firstNameSnapshot: string;
  middleNameSnapshot: string | null;
  lastNameSnapshot: string;
  secondLastNameSnapshot: string | null;
  phoneNumber: string | null;
  legalIdSnapshot: string;
  visitReason: string;
  externalWorkerId: string | null;
}) => ({
  entryTimestamp: accessLog.entryTimestamp,
  exitTimestamp: accessLog.exitTimestamp,
  companyNameSnapshot: accessLog.companyNameSnapshot,
  firstNameSnapshot: accessLog.firstNameSnapshot,
  middleNameSnapshot: accessLog.middleNameSnapshot,
  lastNameSnapshot: accessLog.lastNameSnapshot,
  secondLastNameSnapshot: accessLog.secondLastNameSnapshot,
  phoneNumber: accessLog.phoneNumber,
  legalIdSnapshot: accessLog.legalIdSnapshot,
  visitReason: accessLog.visitReason,
  externalWorkerId: accessLog.externalWorkerId,
});

export async function updateAccessLog(
  input: Record<string, unknown>,
  accessLogId: string,
  options: UpdateAccessLogOptions,
) {
  const parsed = await updateAccessLogSchema.safeParseAsync(input);
  if (!parsed.success) {
    return { success: false as const, errors: z.treeifyError(parsed.error) };
  }

  const editor = await UserEntity.getByUsername(options.authorUsername);
  if (!editor) {
    return { success: false as const, errors: "unauthorized" };
  }

  const current = await AccessLogEntity.findFirst({ id: accessLogId });
  if (!current || (options.lockedSiteId && current.siteId !== options.lockedSiteId)) {
    return { success: false as const, errors: "not_found" };
  }

  const {
    expectedEntryTimestamp,
    expectedExitTimestamp,
    ...data
  } = parsed.data;
  if (
    current.entryTimestamp.getTime() !== expectedEntryTimestamp.getTime() ||
    (current.exitTimestamp?.getTime() ?? null) !==
      (expectedExitTimestamp?.getTime() ?? null)
  ) {
    return {
      success: false as const,
      code: "conflict" as const,
      errors:
        "El registro cambió mientras estaba abierto. Cierra el editor y vuelve a intentarlo con los datos actualizados.",
    };
  }

  if (
    data.exitTimestamp === null &&
    (await AccessLogEntity.findOpenByLegalIdInSite(
      data.legalIdSnapshot,
      current.siteId,
      current.id,
    ))
  ) {
    return {
      success: false as const,
      errors:
        "Esta persona ya tiene otro acceso abierto en el centro. No se puede guardar el registro sin salida.",
    };
  }

  let externalWorkerId: string | null = data.externalWorkerId ?? null;
  if (externalWorkerId) {
    const worker = await ExternalWorkerEntity.findById(externalWorkerId);
    const sameIdentity =
      worker !== null &&
      worker.firstName === data.firstNameSnapshot &&
      (worker.middleName ?? null) === (data.middleNameSnapshot ?? null) &&
      worker.lastName === data.lastNameSnapshot &&
      (worker.secondLastName ?? null) === (data.secondLastNameSnapshot ?? null) &&
      (worker.phoneNumber ?? null) === (data.phoneNumber ?? null) &&
      worker.legalId.toUpperCase() === data.legalIdSnapshot;
    if (!sameIdentity) externalWorkerId = null;
  }

  const exitWasRemoved = data.exitTimestamp === null;
  const exitWasAdded = current.exitTimestamp === null && data.exitTimestamp !== null;
  const updateData = {
    ...data,
    middleNameSnapshot: data.middleNameSnapshot ?? null,
    secondLastNameSnapshot: data.secondLastNameSnapshot ?? null,
    phoneNumber: data.phoneNumber ?? null,
    externalWorkerId,
    exitSignatureEnvelope: exitWasRemoved
      ? null
      : current.exitSignatureEnvelope,
    exitRecordedById: exitWasRemoved
      ? null
      : exitWasAdded
        ? editor.id
        : current.exitRecordedById,
  };

  const expectedUpdated = { ...current, ...updateData };
  const updated = await AccessLogEntity.updateWithAudit(
    accessLogId,
    updateData,
    {
      entityType: "AccessLog",
      entityId: accessLogId,
      action: "UPDATE",
      changedBy: editor.id,
      summary: `Registro de acceso de ${expectedUpdated.firstNameSnapshot} ${expectedUpdated.lastNameSnapshot} actualizado`,
      metadata: {
        previous: editableSnapshot(current),
        updated: editableSnapshot(expectedUpdated),
      },
    },
    {
      entryTimestamp: current.entryTimestamp,
      exitTimestamp: current.exitTimestamp,
    },
    options.lockedSiteId,
  );
  if (!updated) {
    return {
      success: false as const,
      code: "conflict" as const,
      errors:
        "El registro cambió mientras se guardaba. Cierra el editor y vuelve a intentarlo con los datos actualizados.",
    };
  }

  return { success: true as const };
}
