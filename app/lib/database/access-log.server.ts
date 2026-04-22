import { performance } from "node:perf_hooks";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../prisma.server";

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

export type GetAccessLogsInput = {
  siteId?: string;
  timestampField?: AccessLogTimestampField;
} & AccessLogDateFilter;

export type CreateAccessLogInput = {
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

export type MarkAccessLogExitInput = {
  accessLogId: string;
  exitSignatureEnvelope: Prisma.InputJsonValue;
  exitRecordedById: string;
  siteId?: string;
};

export class AccessLogEntity {
  private static DEFAULT_INCLUDE = {
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
  };

  private static getTimestampRangeFilter(filter: GetAccessLogsInput) {
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

  private static async createAccessWithVehicle(
    tx: Prisma.TransactionClient,
    vehicleData: NonNullable<CreateAccessLogInput["vehicle"]>,
  ) {
    return await tx.accessLogVehicle.create({
      data: {
        typeSnapshot: vehicleData.typeSnapshot ?? "",
        brandSnapshot: vehicleData.brandSnapshot,
        modelSnapshot: vehicleData.modelSnapshot,
        plateSnapshot: vehicleData.plateSnapshot ?? "",
      },
    });
  }

  public static async create(data: CreateAccessLogInput) {
    const start = performance.now();

    try {
      return await prisma.$transaction(async (tx) => {
        const vehicleAccessLog = data.withVehicle
          ? await this.createAccessWithVehicle(tx, data.vehicle!)
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
    } catch (e) {
      console.error("[AccessLog.create][error] ", String(e));
    } finally {
      console.log(
        `[AccessLog.create] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async markExit(data: MarkAccessLogExitInput) {
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
      console.log(
        `[AccessLog.markExit] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async findMany(input?: GetAccessLogsInput) {
    const start = performance.now();

    try {
      const timestampField = input?.timestampField ?? "entryTimestamp";

      return await prisma.accessLog.findMany({
        where: input
          ? {
              ...(input.siteId ? { siteId: input.siteId } : {}),
              [timestampField]: this.getTimestampRangeFilter(input),
            }
          : undefined,
        include: this.DEFAULT_INCLUDE,
        orderBy: {
          entryTimestamp: "desc",
        },
      });
    } finally {
      console.log(
        `[AccessLog.findMany] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async findById(id: string) {
    const start = performance.now();

    try {
      return await prisma.accessLog.findUnique({
        where: {
          id,
        },
        include: this.DEFAULT_INCLUDE,
      });
    } finally {
      console.log(
        `[AccessLog.findById] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async hasVehicle(accessLogId: string): Promise<boolean> {
    const start = performance.now();

    try {
      const accessLog = await prisma.accessLog.findUnique({
        where: { id: accessLogId },
        select: { vehicleAccessLogId: true },
      });

      return accessLog?.vehicleAccessLogId != null;
    } finally {
      console.log(
        `[AccessLog.hasVehicle] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async getVehicle(accessLogId: string) {
    const start = performance.now();

    try {
      const accessLog = await prisma.accessLog.findUnique({
        where: { id: accessLogId },
        select: { vehicleAccessLog: true },
      });

      return accessLog?.vehicleAccessLog ?? null;
    } finally {
      console.log(
        `[AccessLog.getVehicle] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }
}
