import type { PlannedAccessStatus, Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../prisma.server";

export type PlannedAccessListItem = Prisma.PlannedAccessGetPayload<{
  include: {
    site: {
      select: {
        id: true;
        name: true;
      };
    };
    requestedBy: {
      select: {
        id: true;
        fullName: true;
        username: true;
      };
    };
    approvedBy: {
      select: {
        id: true;
        fullName: true;
        username: true;
      };
    };
    plannedAccessPersons: {
      include: {
        accessLogs: true;
      };
    };
  };
}>;

export type GetPlannedAccessInput = {
  status?: PlannedAccessStatus;
  siteId?: string;
  requestedById?: string;
  expectedDate?: Date;
};

export type CreatePlannedAccessInput = {
  expectedStartDatetime: Date;
  expectedEndDatetime?: Date;
  companySnapshot: string;
  visitReason: string;
  requestedById: string;
  approvedById: string;
  siteId: string;
  persons: Array<{
    firstNameSnapshot: string;
    middleNameSnapshot?: string;
    lastNameSnapshot: string;
    secondLastNameSnapshot?: string;
    phoneNumber?: string;
    legalIdSnapshot: string;
  }>;
};

export type UpdatePlannedAccessStatusInput = {
  id: string;
  status: PlannedAccessStatus;
  approvedById: string;
  approvedAt?: Date | null;
};

const ACTIVE_STATUSES: PlannedAccessStatus[] = [
  "PENDING_APPROVAL",
  "APPROVED",
  "PARTIALLY_USED",
];

export type OverlappingPlannedAccess = {
  id: string;
  companySnapshot: string;
  expectedStartDatetime: Date;
  expectedEndDatetime: Date | null;
  plannedAccessPersons: Array<{ legalIdSnapshot: string }>;
};

export class PlannedAccessEntity {
  private static DEFAULT_INCLUDE = {
    site: {
      select: {
        id: true,
        name: true,
      },
    },
    requestedBy: {
      select: {
        id: true,
        fullName: true,
        username: true,
      },
    },
    approvedBy: {
      select: {
        id: true,
        fullName: true,
        username: true,
      },
    },
    plannedAccessPersons: {
      orderBy: {
        createdAt: "asc" as const,
      },
      include: {
        accessLogs: true,
      },
    },
  };

  public static async create(data: CreatePlannedAccessInput) {
    return await prisma.plannedAccess.create({
      data: {
        expectedStartDatetime: data.expectedStartDatetime,
        expectedEndDatetime: data.expectedEndDatetime,
        companySnapshot: data.companySnapshot,
        visitReason: data.visitReason,
        requestedById: data.requestedById,
        approvedById: data.approvedById,
        siteId: data.siteId,
        plannedAccessPersons: {
          create: data.persons.map((person) => ({
            firstNameSnapshot: person.firstNameSnapshot,
            middleNameSnapshot: person.middleNameSnapshot,
            lastNameSnapshot: person.lastNameSnapshot,
            secondLastNameSnapshot: person.secondLastNameSnapshot,
            phoneNumber: person.phoneNumber,
            legalIdSnapshot: person.legalIdSnapshot,
          })),
        },
      },
    });
  }

  private static getExpectedDateFilter(
    date: Date,
  ): Prisma.PlannedAccessWhereInput {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return {
      OR: [
        {
          expectedEndDatetime: null,
          expectedStartDatetime: { gte: start, lt: end },
        },
        {
          expectedStartDatetime: { lt: end },
          expectedEndDatetime: { gte: start },
        },
      ],
    };
  }

  public static async findMany(input?: GetPlannedAccessInput) {
    return await prisma.plannedAccess.findMany({
      where: {
        ...(input?.status ? { status: input.status } : {}),
        ...(input?.siteId ? { siteId: input.siteId } : {}),
        ...(input?.requestedById ? { requestedById: input.requestedById } : {}),
        ...(input?.expectedDate
          ? this.getExpectedDateFilter(input.expectedDate)
          : {}),
      },
      include: this.DEFAULT_INCLUDE,
      orderBy: {
        expectedStartDatetime: "desc",
      },
    });
  }

  public static async findById(id: string) {
    return await prisma.plannedAccess.findUnique({
      where: { id },
      include: this.DEFAULT_INCLUDE,
    });
  }

  public static async updateStatus(data: UpdatePlannedAccessStatusInput) {
    return await prisma.plannedAccess.update({
      where: { id: data.id },
      data: {
        status: data.status,
        approvedAt: data.approvedAt,
        approvedById: data.approvedById,
      },
    });
  }

  public static async countLinkedAccessLogs(plannedAccessId: string) {
    return await prisma.accessLog.count({
      where: { plannedAccessId },
    });
  }

  public static async findOverlappingPlannedAccess(
    siteId: string,
    expectedStart: Date,
    expectedEnd: Date | null,
    excludeId?: string,
  ): Promise<OverlappingPlannedAccess[]> {
    const dateFilter: Prisma.PlannedAccessWhereInput = {
      status: { in: ACTIVE_STATUSES },
      siteId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [
        {
          expectedEndDatetime: null,
          expectedStartDatetime: { lte: expectedEnd ?? new Date(2100, 0, 1) },
        },
        {
          expectedStartDatetime: {
            lte: expectedEnd ?? new Date(2100, 0, 1),
          },
          expectedEndDatetime: { gte: expectedStart },
        },
      ],
    };

    return await prisma.plannedAccess.findMany({
      where: dateFilter,
      select: {
        id: true,
        companySnapshot: true,
        expectedStartDatetime: true,
        expectedEndDatetime: true,
        plannedAccessPersons: {
          select: { legalIdSnapshot: true },
        },
      },
    });
  }

  public static async findOverlappingForPerson(
    legalId: string,
    expectedStart: Date,
    expectedEnd: Date | null,
    excludePlannedAccessId?: string,
  ): Promise<OverlappingPlannedAccess[]> {
    const dateFilter: Prisma.PlannedAccessWhereInput = {
      status: { in: ACTIVE_STATUSES },
      ...(excludePlannedAccessId
        ? { id: { not: excludePlannedAccessId } }
        : {}),
      plannedAccessPersons: {
        some: { legalIdSnapshot: legalId },
      },
      OR: [
        {
          expectedEndDatetime: null,
          expectedStartDatetime: { lte: expectedEnd ?? new Date(2100, 0, 1) },
        },
        {
          expectedStartDatetime: {
            lte: expectedEnd ?? new Date(2100, 0, 1),
          },
          expectedEndDatetime: { gte: expectedStart },
        },
      ],
    };

    return await prisma.plannedAccess.findMany({
      where: dateFilter,
      select: {
        id: true,
        companySnapshot: true,
        expectedStartDatetime: true,
        expectedEndDatetime: true,
        plannedAccessPersons: {
          select: { legalIdSnapshot: true },
        },
      },
    });
  }

  public static async hasPersonAccessLog(
    plannedAccessPersonId: string,
  ): Promise<boolean> {
    const count = await prisma.accessLog.count({
      where: { plannedAccessPersonId },
    });
    return count > 0;
  }
}
