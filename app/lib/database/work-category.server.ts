import { prisma } from "../prisma.server";

export class WorkCategoryEntity {
  public static async create(data: { name: string; description?: string; requiresSpecialPermission?: boolean }) {
    return prisma.workCategory.create({
      data: {
        name: data.name,
        description: data.description,
        requiresSpecialPermission: data.requiresSpecialPermission ?? false,
      },
    });
  }

  public static async findById(id: string) {
    return prisma.workCategory.findUnique({
      where: { id },
    });
  }

  public static async findMany() {
    return prisma.workCategory.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  public static async update(id: string, data: { name?: string; description?: string; requiresSpecialPermission?: boolean }) {
    return prisma.workCategory.update({
      where: { id },
      data,
    });
  }

  public static async delete(id: string) {
    return prisma.workCategory.delete({
      where: { id },
    });
  }
}
