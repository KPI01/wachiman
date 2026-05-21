import z from "zod";
import {
  createAccessLogSchema,
  markAccessLogExitSchema,
} from "../schemas/access-log";
import { UserEntity } from "../database/user.server";
import {
  AccessLogEntity,
  type GetAccessLogsInput,
} from "../database/access-log.server";
import { encryptValue } from "../crypt.server";

export type AccessLogStatus = "INSIDE" | "OUTSIDE";

export type GetManyAccessLogsInput = GetAccessLogsInput & {
  status?: AccessLogStatus;
};

async function isPersonAlreadyInside(legalId: string) {
  return (await AccessLogEntity.findOpenByLegalId(legalId)) !== null;
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
        ? { not: null }
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
function buildCreateAccessLogInput({
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
    entrySignatureEnvelope: encryptValue(JSON.stringify(entrySignaturePayload)),
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

  const personIsAlreadyInside = await isPersonAlreadyInside(
    data.legalIdSnapshot,
  );

  if (personIsAlreadyInside) {
    return {
      success: false,
      errors:
        "Esta persona ya se encuentra registrada dentro del centro. No se puede registrar otro acceso para esta persona.",
    };
  }

  const siteId = options.lockedSiteId ?? data.siteId;
  await AccessLogEntity.create(
    buildCreateAccessLogInput({ data, siteId, createdById: createdBy.id }),
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
    exitSignatureEnvelope: encryptValue(
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
