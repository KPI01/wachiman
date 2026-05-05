import type { Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../prisma.server";

export class SiteEntity {
  public static async create(data: Prisma.SiteCreateInput) {
    const site = await prisma.site.create({
      data: {
        name: data.name,
        slug: data.slug,
        address: data.address,
      },
    });

    return site;
  }

  public static async findById(id: string) {
    return prisma.site.findUnique({
      where: { id },
    });
  }

  public static async findBySlug(slug: string, excludedId?: string) {
    return prisma.site.findFirst({
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

  public static async findMany() {
    const sites = await prisma.site.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return sites;
  }

  public static async update(id: string, data: Prisma.SiteUpdateInput) {
    const updatedSite = await prisma.site.update({
      where: { id },
      data,
    });

    return updatedSite;
  }

  public static async delete(id: string) {
    const deletedSite = await prisma.site.delete({
      where: { id },
    });

    return deletedSite;
  }
}
