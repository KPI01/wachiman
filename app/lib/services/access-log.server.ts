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
import { CompanyEntity } from "../database/company.server";
import { WorkCategoryEntity } from "../database/work-category.server";
import { AllowedAreaEntity } from "../database/allowed-area.server";
import { SiteEntity } from "../database/site.server";
import { AppSettingsEntity } from "../database/app-settings.server";

export type AccessLogStatus = "INSIDE" | "OUTSIDE";

export type GetManyAccessLogsInput = GetAccessLogsInput & {
  status?: AccessLogStatus;
};

async function isPersonAlreadyInside(legalId: string, siteId: string) {
  return (await AccessLogEntity.findOpenByLegalIdInSite(legalId, siteId)) !== null;
}


function matchesWorkerIdentity(
  worker: NonNullable<Awaited<ReturnType<typeof ExternalWorkerEntity.findById>>>,
  data: z.infer<typeof createAccessLogSchema>,
) {
  return worker.firstName === data.firstNameSnapshot &&
    (worker.middleName ?? null) === (data.middleNameSnapshot ?? null) &&
    worker.lastName === data.lastNameSnapshot &&
    (worker.secondLastName ?? null) === (data.secondLastNameSnapshot ?? null) &&
    (worker.phoneNumber ?? null) === (data.phoneNumber ?? null) &&
    worker.legalId.toUpperCase() === data.legalIdSnapshot;
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

export async function getOpenAccessLogs(input: { siteId?: string } = {}) {
  return AccessLogEntity.findOpen(input);
}

type CreateAccessLogOptions = {
  authorUsername: string;
  lockedSiteId?: string;
};

type CreateAccessLogInputType = {
  data: z.infer<typeof createAccessLogSchema>;
  siteId: string;
  createdById: string;
  allowedAreaName: string;
  company: NonNullable<Awaited<ReturnType<typeof CompanyEntity.findById>>>;
  site: NonNullable<Awaited<ReturnType<typeof SiteEntity.findById>>>;
  holder: NonNullable<Awaited<ReturnType<typeof AppSettingsEntity.getGlobal>>>;
};
async function buildCreateAccessLogInput({
  data,
  createdById,
  siteId,
  allowedAreaName,
  company,
  site,
  holder,
}: CreateAccessLogInputType) {
  const {
    vehiclePlateSnapshot,
    vehicleBrandSnapshot,
    vehicleModelSnapshot,
    vehicleTypeSnapshot,
    entrySignaturePayload,
    riskInformationAcknowledged: _riskInformationAcknowledged,
    allowedAreaId,
    ...accessLogData
  } = data;

  return {
    ...accessLogData,
    allowedAreaId,
    allowedAreaSnapshot: allowedAreaName,
    siteId,
    createdById,
    companyId: company.id,
    riskAcknowledgedAt: new Date(),
    riskAcknowledgementSnapshot: {
      holderLegalName: holder.holderLegalName,
      holderTaxId: holder.holderTaxId,
      holderFiscalAddress: holder.holderFiscalAddress,
      siteName: site.name,
      siteAddress: site.address,
      riskInformation: site.riskInformation,
      riskInformationVersion: site.riskInformationVersion,
      companyName: company.name,
      companyCif: company.cif,
      companyAddress: company.address,
      acknowledgedAt: new Date().toISOString(),
    },
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

async function resolveExternalWorker(data: z.infer<typeof createAccessLogSchema>) {
  const existingWorker = data.externalWorkerId
    ? await ExternalWorkerEntity.findById(data.externalWorkerId)
    : await ExternalWorkerEntity.findByLegalId(data.legalIdSnapshot);

  if (existingWorker) return existingWorker;

  const company = await CompanyEntity.findOrCreateByName(data.companyNameSnapshot);
  const workCategoryId = await WorkCategoryEntity.resolveDefault();

  return ExternalWorkerEntity.findOrCreateByLegalId({
    firstName: data.firstNameSnapshot,
    middleName: data.middleNameSnapshot,
    lastName: data.lastNameSnapshot,
    secondLastName: data.secondLastNameSnapshot,
    phoneNumber: data.phoneNumber,
    legalId: data.legalIdSnapshot,
    companyId: company.id,
    workCategoryId,
  });
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
  const allowedArea = await AllowedAreaEntity.findById(data.allowedAreaId);
  if (!allowedArea) {
    return { success: false, errors: "El área autorizada seleccionada no existe." };
  }

  const [site, company, holder] = await Promise.all([
    SiteEntity.findById(siteId),
    CompanyEntity.findById(data.companyId),
    AppSettingsEntity.getGlobal(),
  ]);
  if (!site || !site.riskInformation || !holder?.holderLegalName || !holder.holderTaxId || !holder.holderFiscalAddress) {
    return { success: false, errors: "El centro y la empresa titular deben tener configurada la información de riesgos." };
  }
  if (!company || !company.cif || !company.address) {
    return { success: false, errors: "La empresa contratista debe tener razón social, CIF y dirección configurados." };
  }
  if (company.name.trim().toUpperCase() !== data.companyNameSnapshot.trim().toUpperCase()) {
    return { success: false, errors: "La empresa seleccionada no coincide con sus datos." };
  }

  const externalWorker = await resolveExternalWorker(data);

  const workerForAccess = externalWorker as {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    secondLastName: string | null;
    phoneNumber: string | null;
    legalId: string;
    workCategory?: { requiresTraining?: boolean | null; requiresSpecialPermission?: boolean | null } | null;
  };

  if (
    workerForAccess.firstName !== data.firstNameSnapshot ||
    (workerForAccess.middleName ?? null) !== (data.middleNameSnapshot ?? null) ||
    workerForAccess.lastName !== data.lastNameSnapshot ||
    (workerForAccess.secondLastName ?? null) !== (data.secondLastNameSnapshot ?? null) ||
    (workerForAccess.phoneNumber ?? null) !== (data.phoneNumber ?? null) ||
    workerForAccess.legalId.toUpperCase() !== data.legalIdSnapshot
  ) {
    return {
      success: false,
      errors: "El trabajador externo no coincide con los datos de la persona registrada.",
    };
  }

  if (!workerForAccess.workCategory) {
    return { success: false, errors: "El trabajador externo no tiene un tipo de trabajo válido." };
  }


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
    {
      ...(await buildCreateAccessLogInput({
        data,
        siteId,
        createdById: createdBy.id,
        allowedAreaName: allowedArea.name,
        company,
        site,
        holder,
      })),
      externalWorkerId: externalWorker.id,
    },
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
  allowedAreaSnapshot: string;
  allowedAreaId: string | null;
  approvedBySnapshot: string;
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
  allowedAreaSnapshot: accessLog.allowedAreaSnapshot,
  allowedAreaId: accessLog.allowedAreaId,
  approvedBySnapshot: accessLog.approvedBySnapshot,
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
  const allowedArea = await AllowedAreaEntity.findById(data.allowedAreaId);
  if (!allowedArea) {
    return { success: false as const, errors: "El área autorizada seleccionada no existe." };
  }
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
    allowedAreaSnapshot: allowedArea.name,
    allowedAreaId: allowedArea.id,
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
