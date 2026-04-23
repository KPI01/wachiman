import { performance } from "node:perf_hooks";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../prisma.server";

export class DepartmentEntity {
  static async create(data: Prisma.DepartmentCreateInput) {
    const start = performance.now();

    try {
      const department = await prisma.department.create({
        data: {
          name: data.name,
          slug: data.slug,
        },
      });

      return department;
    } finally {
      console.log(
        `[DepartmentEntity.create] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  static async findById(id: string) {
    const start = performance.now();

    try {
      return prisma.department.findUnique({
        where: { id },
      });
    } finally {
      console.log(
        `[DepartmentEntity.findById] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  static async findBySlug(slug: string, excludedId?: string) {
    const start = performance.now();

    try {
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
    } finally {
      console.log(
        `[DepartmentEntity.findBySlug] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  static async findAll() {
    const start = performance.now();

    try {
      const departments = await prisma.department.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return departments;
    } finally {
      console.log(
        `[DepartmentEntity.findAll] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  static async update(id: string, data: Prisma.DepartmentUpdateInput) {
    const start = performance.now();

    try {
      const updatedDepartment = await prisma.department.update({
        where: { id },
        data,
      });

      return updatedDepartment;
    } finally {
      console.log(
        `[DepartmentEntity.update] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  static async delete(id: string) {
    const start = performance.now();

    try {
      const deletedDepartment = await prisma.department.delete({
        where: { id },
      });

      return deletedDepartment;
    } finally {
      console.log(
        `[DepartmentEntity.delete] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }
}
