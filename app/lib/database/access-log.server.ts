import type { Prisma } from "../../../prisma/generated/prisma/client";
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
  exitTimestamp?: Prisma.AccessLogWhereInput["exitTimestamp"];
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

type AccessLogFindFirstInput = {
  entryTimestamp?: Date;
  exitTimestamp?: Date | boolean;
} & (
  | {
      id: string;
      legalId?: never;
    }
  | { id?: never; legalId: string }
);

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

    const start = new Date(filter.from!);
    start.setHours(0, 0, 0, 0);

    const end = new Date(filter.to!);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);

    return { gte: start, lt: end };
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
  }

  public static async markExit(data: MarkAccessLogExitInput) {
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
  }

  public static async findMany(input?: GetAccessLogsInput) {
    const timestampField = input?.timestampField ?? "entryTimestamp";

    const exitTimestampFilter =
      input?.exitTimestamp !== undefined
        ? { exitTimestamp: input.exitTimestamp }
        : {};

    return await prisma.accessLog.findMany({
      where: input
        ? {
            ...(input.siteId ? { siteId: input.siteId } : {}),
            [timestampField]: this.getTimestampRangeFilter(input),
            ...exitTimestampFilter,
          }
        : undefined,
      include: this.DEFAULT_INCLUDE,
      orderBy: {
        entryTimestamp: "desc",
      },
    });
  }

  public static async findOpenByLegalId(legalId: string) {
    return await prisma.accessLog.findFirst({
      where: {
        legalIdSnapshot: legalId,
        exitTimestamp: null,
      },
    });
  }

  public static async findOpenByLegalIdInSite(legalId: string, siteId: string) {
    return await prisma.accessLog.findFirst({
      where: {
        siteId,
        legalIdSnapshot: legalId,
        exitTimestamp: null,
      },
    });
  }

  public static async findFirst(where: AccessLogFindFirstInput) {
    const { entryTimestamp, exitTimestamp, ...userWhere } = where;

    return await prisma.accessLog.findFirst({
      where: {
        ...userWhere,

        ...(entryTimestamp !== undefined ? { entryTimestamp } : {}),

        ...(exitTimestamp !== undefined
          ? typeof exitTimestamp === "boolean"
            ? { exitTimestamp: { not: null } }
            : { exitTimestamp }
          : {}),
      },
      include: this.DEFAULT_INCLUDE,
    });
  }

  public static async hasVehicle(accessLogId: string): Promise<boolean> {
    const accessLog = await prisma.accessLog.findUnique({
      where: { id: accessLogId },
      select: { vehicleAccessLogId: true },
    });

    return accessLog?.vehicleAccessLogId != null;
  }

  public static async getVehicle(accessLogId: string) {
    const accessLog = await prisma.accessLog.findUnique({
      where: { id: accessLogId },
      select: { vehicleAccessLog: true },
    });

    return accessLog?.vehicleAccessLog ?? null;
  }
}
