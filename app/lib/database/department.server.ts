import type { Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../prisma.server";

export class DepartmentEntity {
  static async create(data: Prisma.DepartmentCreateInput) {
    const department = await prisma.department.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
    });

    return department;
  }

  static async findById(id: string) {
    return prisma.department.findUnique({
      where: { id },
    });
  }

  static async findBySlug(slug: string, excludedId?: string) {
    return prisma.department.findFirst({
      where: {
        slug,
        ...(excludedId
          ? {
              NOT: {
                id: excludedId,
              },
            }
          : {}),
      },
    });
  }

  static async findAll() {
    const departments = await prisma.department.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return departments;
  }

  static async update(id: string, data: Prisma.DepartmentUpdateInput) {
    const updatedDepartment = await prisma.department.update({
      where: { id },
      data,
    });

    return updatedDepartment;
  }

  static async delete(id: string) {
    const deletedDepartment = await prisma.department.delete({
      where: { id },
    });

    return deletedDepartment;
  }
}
