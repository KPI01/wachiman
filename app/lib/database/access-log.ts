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

type AccessLogTimestampField = "entryTimestamp" | "exitTimestamp";

type AccessLogDateFilter =
  | {
      date: Date;
      from?: never;
      to?: never;
    }
  | {
      date?: never;
      from: Date;
      to: Date;
    };

type GetAccessLogsInput = {
  siteId?: string;
  timestampField?: AccessLogTimestampField;
} & AccessLogDateFilter;

type CreateAccessLogInput = {
  entryTimestamp: Date;
  entrySignatureEnvelope: Prisma.InputJsonValue;
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
          entrySignatureEnvelope: data.entrySignatureEnvelope,
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

type MarkAccessLogExitInput = {
  accessLogId: string;
  exitSignatureEnvelope: Prisma.InputJsonValue;
  exitRecordedById: string;
  siteId?: string;
};

function getTimestampRangeFilter(filter: GetAccessLogsInput) {
  if (filter.date) {
    const start = new Date(filter.date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { gte: start, lt: end };
  }

  return {
    gte: filter.from,
    lte: filter.to,
  };
}

export async function markAccessLogExit(data: MarkAccessLogExitInput) {
  const start = performance.now();

  try {
    const result = await prisma.accessLog.updateMany({
      where: {
        id: data.accessLogId,
        exitTimestamp: null,
        ...(data.siteId ? { siteId: data.siteId } : {}),
      },
      data: {
        exitTimestamp: new Date(),
        exitSignatureEnvelope: data.exitSignatureEnvelope,
        exitRecordedById: data.exitRecordedById,
      },
    });

    return result.count > 0;
  } finally {
    console.log(`[markAccessLogExit] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function getAccessLogs(input?: GetAccessLogsInput) {
  const start = performance.now();

  try {
    const timestampField = input?.timestampField ?? "entryTimestamp";

    return await prisma.accessLog.findMany({
      where: input
        ? {
            ...(input.siteId ? { siteId: input.siteId } : {}),
            [timestampField]: getTimestampRangeFilter(input),
          }
        : undefined,
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

export async function getAccessLogById(id: string) {
  const start = performance.now();

  try {
    return await prisma.accessLog.findUnique({
      where: {
        id,
      },
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
    });
  } finally {
    console.log(`[getAccessLogById] ${(performance.now() - start).toFixed(2)}ms`);
  }
}
