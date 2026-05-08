import z, { success } from "zod";
import { createAccessLogSchema, markAccessLogExitSchema } from "../schemas/access-log";
import { UserEntity } from "../database/user.server";
import { AccessLogEntity, type GetAccessLogsInput } from "../database/access-log.server";
import { encryptValue } from "../crypt.server";

async function isPersonAlreadyInside(siteId: string, legalId: string) {
    const todaysLogs = await AccessLogEntity.findMany({
        siteId,
        timestampField: "entryTimestamp",
        date: new Date(),
    })
    const peopleInside = todaysLogs
        .filter(log => log.exitTimestamp === null)
    const personIsInside = peopleInside
        .some(person => person.legalIdSnapshot === legalId)

    return personIsInside
}

export async function getManyAccessLogs(input?: GetAccessLogsInput) {
    return await AccessLogEntity.findMany(input);
}

type CreateAccessLogOptions = {
    authorUsername: string;
    lockedSiteId?: string;
};

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
    const personIsAlreadyInside = await isPersonAlreadyInside(data.siteId, data.legalIdSnapshot)

    if (personIsAlreadyInside) {
        return { success: false, errors: "Esta persona ya se encuentra registrada dentro del centro. No se puede registrar otro acceso para esta persona." }
    }


    await AccessLogEntity.create({
        entryTimestamp: data.entryTimestamp,
        entrySignatureEnvelope: encryptValue(
            JSON.stringify(data.entrySignaturePayload),
        ),
        companyNameSnapshot: data.companyNameSnapshot,
        firstNameSnapshot: data.firstNameSnapshot,
        middleNameSnapshot: data.middleNameSnapshot,
        lastNameSnapshot: data.lastNameSnapshot,
        secondLastNameSnapshot: data.secondLastNameSnapshot,
        phoneNumber: data.phoneNumber,
        legalIdSnapshot: data.legalIdSnapshot,
        visitReason: data.visitReason,
        siteId,
        withVehicle: data.withVehicle,
        createdById: createdBy.id,
        vehicle: data.withVehicle
            ? {
                typeSnapshot: data.vehicleTypeSnapshot ?? "",
                brandSnapshot: data.vehicleBrandSnapshot,
                modelSnapshot: data.vehicleModelSnapshot,
                plateSnapshot: data.vehiclePlateSnapshot ?? "",
            }
            : undefined,
    });

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
