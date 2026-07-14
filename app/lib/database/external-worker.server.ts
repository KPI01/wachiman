import type { Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../prisma.server";

export type ExternalWorkerListItem = Prisma.ExternalWorkerGetPayload<{
  include: {
    company: { select: { id: true; name: true } };
    workCategory: { select: { id: true; name: true } };
  };
}>;

export type ExternalWorkerDetail = Prisma.ExternalWorkerGetPayload<{
  include: {
    company: true;
    workCategory: true;
    accessLogs: {
      include: {
        site: { select: { id: true; name: true } };
        createdBy: { select: { id: true; fullName: true; username: true } };
      };
    };
    plannedAccessPersons: {
      include: {
        plannedAccess: {
          include: {
            site: { select: { id: true; name: true } };
            requestedBy: { select: { id: true; fullName: true } };
            approvedBy: { select: { id: true; fullName: true } };
          };
        };
      };
    };
  };
}>;

export type CreateExternalWorkerInput = {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  phoneNumber?: string;
  legalId: string;
  companyId: string;
  workCategoryId: string;
};

export type UpdateExternalWorkerInput = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  secondLastName?: string;
  phoneNumber?: string;
  legalId?: string;
  companyId?: string;
  workCategoryId?: string;
};

export class ExternalWorkerEntity {
  private static DEFAULT_INCLUDE = {
    company: {
      select: {
        id: true,
        name: true,
      },
    },
    workCategory: {
      select: {
        id: true,
        name: true,
      },
    },
  };

  public static async create(data: CreateExternalWorkerInput) {
    return prisma.externalWorker.create({
      data: {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        secondLastName: data.secondLastName,
        phoneNumber: data.phoneNumber,
        legalId: data.legalId,
        companyId: data.companyId,
        workCategoryId: data.workCategoryId,
      },
      include: this.DEFAULT_INCLUDE,
    });
  }

  public static async findById(id: string): Promise<ExternalWorkerDetail | null> {
    return prisma.externalWorker.findUnique({
      where: { id },
      include: {
        company: true,
        workCategory: true,
        accessLogs: {
          include: {
            site: { select: { id: true, name: true } },
            createdBy: { select: { id: true, fullName: true, username: true } },
          },
          orderBy: { entryTimestamp: "desc" },
          take: 50,
        },
        plannedAccessPersons: {
          include: {
            plannedAccess: {
              include: {
                site: { select: { id: true, name: true } },
                requestedBy: { select: { id: true, fullName: true } },
                approvedBy: { select: { id: true, fullName: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
  }

  public static async findByLegalId(legalId: string) {
    return prisma.externalWorker.findUnique({
      where: { legalId },
      include: this.DEFAULT_INCLUDE,
    });
  }

  public static async findByLegalIdExcluding(legalId: string, excludedId: string) {
    return prisma.externalWorker.findFirst({
      where: {
        legalId,
        NOT: { id: excludedId },
      },
    });
  }

  public static async findMany(): Promise<ExternalWorkerListItem[]> {
    return prisma.externalWorker.findMany({
      orderBy: { createdAt: "desc" },
      include: this.DEFAULT_INCLUDE,
    });
  }

  public static async search(query: string) {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return [];

    return prisma.externalWorker.findMany({
      where: {
        OR: [
          { legalId: { contains: normalizedQuery, mode: "insensitive" } },
          { firstName: { contains: normalizedQuery, mode: "insensitive" } },
          { lastName: { contains: normalizedQuery, mode: "insensitive" } },
        ],
      },
      include: this.DEFAULT_INCLUDE,
      take: 10,
      orderBy: { createdAt: "desc" },
    });
  }

  public static async update(id: string, data: UpdateExternalWorkerInput) {
    return prisma.externalWorker.update({
      where: { id },
      data: {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        secondLastName: data.secondLastName,
        phoneNumber: data.phoneNumber,
        legalId: data.legalId,
        companyId: data.companyId,
        workCategoryId: data.workCategoryId,
      },
      include: this.DEFAULT_INCLUDE,
    });
  }

  public static async delete(id: string) {
    return prisma.externalWorker.delete({
      where: { id },
    });
  }
}
