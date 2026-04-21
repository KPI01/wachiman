import z from "zod";
import { UserRole } from "../../../generated/prisma/enums";
import { encryptValue } from "~/lib/crypt.server";
import { createAccessLog } from "~/lib/database/access-log.server";
import { getUserByUsername } from "~/lib/database/user.server";
import { createAccessLogSchema } from "~/lib/schemas/access-log";
import { getSessionSite, getSessionUser } from "~/lib/session.server";

type HandleCreateAccessLogOptions = {
  restrictToSessionSite?: boolean;
};

export async function handleCreateAccessLog(
  request: Request,
  options: HandleCreateAccessLogOptions = {},
) {
  console.log("[handleCreateAccessLog] start");
  const rawFormData = await request.formData();
  const sessionUser = await getSessionUser(request);

  if (!sessionUser) {
    console.log("[handleCreateAccessLog][no session] start");
    throw new Response("Unauthorized", { status: 401 });
  }

  const jsonData = Object.fromEntries(rawFormData);
  let lockedSiteId: string | undefined;

  if (
    options.restrictToSessionSite ||
    sessionUser.role === UserRole.ACCESS_OPERATOR
  ) {
    const sessionSite = await getSessionSite(request);

    if (!sessionSite) {
      console.log("[handleCreateAccessLog][no Site in session] end");
      throw new Response("Unauthorized", { status: 401 });
    }

    lockedSiteId = sessionSite.id;
    jsonData.siteId = sessionSite.id;
  }

  const { error, data, success } =
    await createAccessLogSchema.safeParseAsync(jsonData);

  if (error) {
    console.log(
      "[handleCreateAccessLog][validation error]",
      JSON.stringify(z.treeifyError(error)),
    );

    return { errors: z.treeifyError(error) };
  }

  const createdBy = await getUserByUsername(sessionUser.username);

  if (!createdBy) {
    console.log("[handleCreateAccessLog][createdBy not found] end");
    throw new Response("Unauthorized", { status: 401 });
  }

  let siteId = data.siteId;

  if (lockedSiteId) {
    siteId = lockedSiteId;
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

  console.log("[handleCreateAccessLog][success] end");
  return { success };
}
