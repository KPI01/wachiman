import type { Prisma, Site } from "../../../prisma/generated/prisma/client";
import { prisma } from "../prisma.server";

type PlannedAccessWithRelations = Prisma.PlannedAccessGetPayload<{
  include: {
    approvedBy: {
      select: {
        id: true;
        fullName: true;
      };
    };
    plannedAccessPersons: true;
    plannedAccessVehicles: true;
  };
}>;

type CreatePlannedAccessPerson = {
  firstNameSnapshot: string;
  middleNameSnapshot?: string;
  lastNameSnapshot: string;
  secondLastNameSnapshot?: string;
  legalIdSnapshot: string;
};

type CreatePlannedAccessVehicle = {
  typeSnapshot: string;
  brandSnapshot?: string;
  modelSnapshot?: string;
  plateSnapshot: string;
};

type CreatePlannedAccessInput = {
  expectedStartDate: Date;
  expectedEndDate?: Date | null;
  approvedById?: string;
  persons: CreatePlannedAccessPerson[];
  vehicles: CreatePlannedAccessVehicle[];
};

type UpdatePlannedAccessInput = {
  expectedStartDate?: Date;
  expectedEndDate?: Date | null;
  status?: Prisma.PlannedAccessUpdateInput["status"];
  approvedAt?: Date | null;
  approvedById?: string;
};

type FindManyPlannedAccessFilter = {
  site: string;
  department: string;
};

export class PlannedAccessEntity {
  public static async create(data: CreatePlannedAccessInput) {
    const plannedAccess = await prisma.$transaction(async (tx) => {
      const pa = await tx.plannedAccess.create({
        data: {
          expectedStartDate: data.expectedStartDate,
          expectedEndDate: data.expectedEndDate,
          ...(data.approvedById ? { approvedById: data.approvedById } : {}),
        } as Prisma.PlannedAccessUncheckedCreateInput,
      });

      if (data.persons.length > 0) {
        await tx.plannedAccessPerson.createMany({
          data: data.persons.map((p) => ({
            firstNameSnapshot: p.firstNameSnapshot,
            middleNameSnapshot: p.middleNameSnapshot ?? null,
            lastNameSnapshot: p.lastNameSnapshot,
            secondLastNameSnapshot: p.secondLastNameSnapshot ?? null,
            legalIdSnapshot: p.legalIdSnapshot,
            plannedAccessId: pa.id,
          })),
        });
      }

      if (data.vehicles.length > 0) {
        await tx.plannedAccessVehicle.createMany({
          data: data.vehicles.map((v) => ({
            typeSnapshot: v.typeSnapshot,
            brandSnapshot: v.brandSnapshot ?? null,
            modelSnapshot: v.modelSnapshot ?? null,
            plateSnapshot: v.plateSnapshot,
            plannedAccessId: pa.id,
          })),
        });
      }

      return pa;
    });

    return plannedAccess;
  }

  public static async findById(id: string) {
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
  }

  public static async findMany(
    filters?: FindManyPlannedAccessFilter,
  ): Promise<PlannedAccessWithRelations[]> {
    const plannedAccesses = await prisma.plannedAccess.findMany({
      where: filters ? {} : undefined,
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
        plannedAccessPersons: true,
        plannedAccessVehicles: true,
      },
    });

    return plannedAccesses;
  }

  public static async update(id: string, data: UpdatePlannedAccessInput) {
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
  }

  public static async addPersons(
    id: string,
    persons: Record<string, string>[],
  ) {
    await prisma.plannedAccessPerson.createMany({
      data: persons.map((p) => ({
        firstNameSnapshot: p.firstNameSnapshot,
        middleNameSnapshot: p.middleNameSnapshot ?? null,
        lastNameSnapshot: p.lastNameSnapshot,
        secondLastNameSnapshot: p.secondLastNameSnapshot ?? null,
        legalIdSnapshot: p.legalIdSnapshot,
        plannedAccessId: id,
      })),
    });
  }

  public static async addVehicles(
    id: string,
    vehicles: Record<string, string>[],
  ) {
    await prisma.plannedAccessVehicle.createMany({
      data: vehicles.map((v) => ({
        typeSnapshot: v.typeSnapshot,
        brandSnapshot: v.brandSnapshot ?? null,
        modelSnapshot: v.modelSnapshot ?? null,
        plateSnapshot: v.plateSnapshot,
        plannedAccessId: id,
      })),
    });
  }
}
