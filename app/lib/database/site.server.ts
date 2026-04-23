import { performance } from "node:perf_hooks";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../prisma.server";

export class SiteEntity {
  public static async create(data: Prisma.SiteCreateInput) {
    const start = performance.now();

    try {
      const site = await prisma.site.create({
        data: {
          name: data.name,
          slug: data.slug,
          address: data.address,
        },
      });

      return site;
    } finally {
      console.log(
        `[SiteEntity.create] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async findById(id: string) {
    const start = performance.now();

    try {
      return prisma.site.findUnique({
        where: { id },
      });
    } finally {
      console.log(
        `[SiteEntity.findById] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async findBySlug(slug: string, excludedId?: string) {
    const start = performance.now();

    try {
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
    } finally {
      console.log(
        `[SiteEntity.findBySlug] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async findMany() {
    const start = performance.now();

    try {
      const sites = await prisma.site.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return sites;
    } finally {
      console.log(
        `[SiteEntity.findMany] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async update(id: string, data: Prisma.SiteUpdateInput) {
    const start = performance.now();

    try {
      const updatedSite = await prisma.site.update({
        where: { id },
        data,
      });

      return updatedSite;
    } finally {
      console.log(
        `[SiteEntity.update] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async delete(id: string) {
    const start = performance.now();

    try {
      const deletedSite = await prisma.site.delete({
        where: { id },
      });

      return deletedSite;
    } finally {
      console.log(
        `[SiteEntity.delete] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }
}
