import { performance } from "node:perf_hooks";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../prisma";

export type AccessLogListItem = Prisma.AccessLogGetPayload<{
  include: {
    site: {
      select: {
        id: true;
        name: true;
      };
    };
    createdBy: {
      select: {
        id: true;
        fullName: true;
        username: true;
      };
    };
    vehicleAccessLog: true;
  };
}>;

type CreateAccessLogInput = {
  entryTimestamp: Date;
  companyNameSnapshot: string;
  firstNameSnapshot: string;
  middleNameSnapshot?: string;
  lastNameSnapshot: string;
  secondLastNameSnapshot?: string;
  phoneNumber?: string;
  legalIdSnapshot: string;
  withVehicle: boolean;
  visitReason: string;
  siteId: string;
  createdById: string;
  vehicle?: {
    typeSnapshot: string;
    brandSnapshot?: string;
    modelSnapshot?: string;
    plateSnapshot: string;
  };
};

export async function createAccessLog(data: CreateAccessLogInput) {
  const start = performance.now();

  try {
    return await prisma.$transaction(async (tx) => {
      const vehicleAccessLog = data.withVehicle
        ? await tx.accessLogVehicle.create({
            data: {
              typeSnapshot: data.vehicle?.typeSnapshot ?? "",
              brandSnapshot: data.vehicle?.brandSnapshot,
              modelSnapshot: data.vehicle?.modelSnapshot,
              plateSnapshot: data.vehicle?.plateSnapshot ?? "",
            },
          })
        : null;

      return await tx.accessLog.create({
        data: {
          entryTimestamp: data.entryTimestamp,
          companyNameSnapshot: data.companyNameSnapshot,
          firstNameSnapshot: data.firstNameSnapshot,
          middleNameSnapshot: data.middleNameSnapshot,
          lastNameSnapshot: data.lastNameSnapshot,
          secondLastNameSnapshot: data.secondLastNameSnapshot,
          phoneNumber: data.phoneNumber,
          legalIdSnapshot: data.legalIdSnapshot,
          withVehicle: data.withVehicle,
          visitReason: data.visitReason,
          siteId: data.siteId,
          createdById: data.createdById,
          vehicleAccessLogId: vehicleAccessLog?.id,
        },
      });
    });
  } finally {
    console.log(`[createAccessLog] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function markAccessLogExit(accessLogId: string) {
  const start = performance.now();

  try {
    return await prisma.accessLog.update({
      where: {
        id: accessLogId,
      },
      data: {
        exitTimestamp: new Date(),
      },
    });
  } finally {
    console.log(`[markAccessLogExit] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function getAccessLogs() {
  const start = performance.now();

  try {
    return await prisma.accessLog.findMany({
      include: {
        site: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        vehicleAccessLog: true,
      },
      orderBy: {
        entryTimestamp: "desc",
      },
    });
  } finally {
    console.log(`[getAccessLogs] ${(performance.now() - start).toFixed(2)}ms`);
  }
}
