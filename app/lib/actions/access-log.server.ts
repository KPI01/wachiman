import z from "zod";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { encryptValue } from "~/lib/crypt.server";
import { AccessLogEntity } from "~/lib/database/access-log.server";
import { UserEntity } from "~/lib/database/user.server";
import { createAccessLogSchema } from "~/lib/schemas/access-log";
import { isAuthenticated } from "~/lib/auth.server";
import { getSessionSite } from "~/lib/session.server";

type HandleCreateAccessLogOptions = {
  restrictToSessionSite?: boolean;
};

export async function handleCreateAccessLog(
  request: Request,
  options: HandleCreateAccessLogOptions = {},
) {
  const rawFormData = await request.formData();
  const sessionUser = await isAuthenticated(request);

  const jsonData = Object.fromEntries(rawFormData);
  let lockedSiteId: string | undefined;

  if (
    options.restrictToSessionSite ||
    sessionUser.role === UserRole.ACCESS_OPERATOR
  ) {
    const sessionSite = await getSessionSite(request);

    if (!sessionSite) {
      throw new Response("Unauthorized", { status: 401 });
    }

    lockedSiteId = sessionSite.id;
    jsonData.siteId = sessionSite.id;
  }

  const { error, data, success } =
    await createAccessLogSchema.safeParseAsync(jsonData);

  if (error) {
    return { errors: z.treeifyError(error) };
  }

  const createdBy = await UserEntity.getByUsername(sessionUser.username);

  if (!createdBy) {
    throw new Response("Unauthorized", { status: 401 });
  }

  let siteId = data.siteId;

  if (lockedSiteId) {
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

  return { success };
}
