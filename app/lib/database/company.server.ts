import type { Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../prisma.server";

export class CompanyEntity {
  public static async create(data: { name: string; slug: string; cif?: string; address?: string; phone?: string; email?: string }) {
    return prisma.company.create({
      data: {
        name: data.name,
        slug: data.slug,
        cif: data.cif ?? "",
        address: data.address,
        phone: data.phone,
        email: data.email,
      },
    });
  }

  public static async findById(id: string) {
    return prisma.company.findUnique({
      where: { id },
    });
  }

  public static async findBySlug(slug: string, excludedId?: string) {
    return prisma.company.findFirst({
      where: {
        slug,
        ...(excludedId ? { NOT: { id: excludedId } } : {}),
      },
    });
  }

  public static async findMany() {
    return prisma.company.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  public static async update(id: string, data: { name?: string; slug?: string; cif?: string; address?: string; phone?: string; email?: string }) {
    return prisma.company.update({
      where: { id },
      data,
    });
  }

  public static async delete(id: string) {
    return prisma.company.delete({
      where: { id },
    });
  }
}
