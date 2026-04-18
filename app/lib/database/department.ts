import { performance } from "node:perf_hooks";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../prisma";

export async function createDepartment(data: Prisma.DepartmentCreateInput) {
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
      `[createDepartment] ${(performance.now() - start).toFixed(2)}ms`,
    );
  }
}

export async function getDepartmentById(id: string) {
  const start = performance.now();

  try {
    return prisma.department.findUnique({
      where: { id },
    });
  } finally {
    console.log(
      `[getDepartmentById] ${(performance.now() - start).toFixed(2)}ms`,
    );
  }
}

export async function getDepartmentBySlug(slug: string, excludedId?: string) {
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
      `[getDepartmentBySlug] ${(performance.now() - start).toFixed(2)}ms`,
    );
  }
}

export async function getDepartments() {
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
      `[getDepartments] ${(performance.now() - start).toFixed(2)}ms`,
    );
  }
}

export async function updateDepartment(
  id: string,
  data: Prisma.DepartmentUpdateInput,
) {
  const start = performance.now();

  try {
    const updatedDepartment = await prisma.department.update({
      where: { id },
      data,
    });

    return updatedDepartment;
  } finally {
    console.log(
      `[updateDepartment] ${(performance.now() - start).toFixed(2)}ms`,
    );
  }
}

export async function deleteDepartment(id: string) {
  const start = performance.now();

  try {
    const deletedDepartment = await prisma.department.delete({
      where: { id },
    });

    return deletedDepartment;
  } finally {
    console.log(
      `[deleteDepartment] ${(performance.now() - start).toFixed(2)}ms`,
    );
  }
}
