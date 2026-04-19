import z from "zod";
import { UserRole } from "../../generated/prisma/enums";
import { encryptValue } from "~/lib/crypt";
import { createAccessLog } from "~/lib/database/access-log";
import { getUserByUsername } from "~/lib/database/user";
import { createAccessLogSchema } from "~/lib/schemas/access-log";
import { getSessionSite, getSessionUser } from "~/lib/session";

type HandleCreateAccessLogOptions = {
  restrictToSessionSite?: boolean;
};

export async function handleCreateAccessLog(
  request: Request,
  options: HandleCreateAccessLogOptions = {},
) {
  const rawFormData = await request.formData();
  const jsonData = Object.fromEntries(rawFormData);

  const { error, data, success } = await createAccessLogSchema.safeParseAsync(
    jsonData,
  );

  if (error) {
    return { errors: z.treeifyError(error) };
  }

  const sessionUser = await getSessionUser(request);

  if (!sessionUser) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const createdBy = await getUserByUsername(sessionUser.username);

  if (!createdBy) {
    throw new Response("Unauthorized", { status: 401 });
  }

  let siteId = data.siteId;

  if (
    options.restrictToSessionSite ||
    sessionUser.role === UserRole.ACCESS_OPERATOR
  ) {
    const sessionSite = await getSessionSite(request);

    if (!sessionSite) {
      throw new Response("Unauthorized", { status: 401 });
    }

    siteId = sessionSite.id;
  }

  await createAccessLog({
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
