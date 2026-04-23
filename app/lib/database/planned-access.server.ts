import { performance } from "node:perf_hooks";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../prisma.server";

type PlannedAccessWithApprover = Prisma.PlannedAccessGetPayload<{
  include: {
    approvedBy: {
      select: {
        id: true;
        fullName: true;
      };
    };
    _count: {
      select: {
        plannedAccessPersons: true;
        plannedAccessVehicles: true;
      };
    };
  };
}>;

type CreatePlannedAccessInput = {
  expectedStartDate: Date;
  expectedEndDate?: Date | null;
  approvedById: string;
};

type UpdatePlannedAccessInput = {
  expectedStartDate?: Date;
  expectedEndDate?: Date | null;
  status?: Prisma.PlannedAccessUpdateInput["status"];
  approvedAt?: Date | null;
  approvedById?: string;
};

export class PlannedAccessEntity {
  public static async create(data: CreatePlannedAccessInput) {
    const start = performance.now();

    try {
      const plannedAccess = await prisma.plannedAccess.create({
        data: {
          expectedStartDate: data.expectedStartDate,
          expectedEndDate: data.expectedEndDate,
          approvedById: data.approvedById,
        } as Prisma.PlannedAccessUncheckedCreateInput,
      });

      return plannedAccess;
    } finally {
      console.log(
        `[PlannedAccessEntity.create] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async findById(id: string) {
    const start = performance.now();

    try {
      return prisma.plannedAccess.findUnique({
        where: { id },
        include: {
          approvedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
          plannedAccessPersons: true,
          plannedAccessVehicles: true,
        },
      });
    } finally {
      console.log(
        `[PlannedAccessEntity.findById] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async findMany(): Promise<PlannedAccessWithApprover[]> {
    const start = performance.now();

    try {
      const plannedAccesses = await prisma.plannedAccess.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          approvedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
          _count: {
            select: {
              plannedAccessPersons: true,
              plannedAccessVehicles: true,
            },
          },
        },
      });

      return plannedAccesses;
    } finally {
      console.log(
        `[PlannedAccessEntity.findMany] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async update(id: string, data: UpdatePlannedAccessInput) {
    const start = performance.now();

    try {
      const updatedPlannedAccess = await prisma.plannedAccess.update({
        where: { id },
        data: {
          expectedStartDate: data.expectedStartDate,
          expectedEndDate: data.expectedEndDate,
          status: data.status,
          approvedAt: data.approvedAt,
          approvedById: data.approvedById,
        } as Prisma.PlannedAccessUncheckedUpdateInput,
      });

      return updatedPlannedAccess;
    } finally {
      console.log(
        `[PlannedAccessEntity.update] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }
}
