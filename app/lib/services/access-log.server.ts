import z from "zod";
import { createAccessLogSchema } from "../schemas/access-log";
import { UserEntity } from "../database/user.server";
import { AccessLogEntity } from "../database/access-log.server";
import { encryptValue } from "../crypt.server";

type CreateAccessLogOptionsType = {
    restrictToSessionSite?: boolean
    authorUsername: string
}
export async function createAccessLog(input: Record<string, unknown>, options: CreateAccessLogOptionsType) {
    let lockedToSiteId: string | undefined

    const parsed = await createAccessLogSchema.safeParseAsync(input)

    if (!parsed.success) {
        return { success: false, error: z.treeifyError(parsed.error) }
    }

    const data = parsed.data
    const createdBy = await UserEntity.getByUsername(options.authorUsername)

    if (!createdBy) {
        return { error: "unauthorized" }
    }

    let siteId = data.siteId
    if (options.lockedSiteId) {
        siteId = lockedSiteId;
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

    return { success: true }
}