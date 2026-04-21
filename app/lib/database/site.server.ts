import { performance } from "node:perf_hooks";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../prisma.server";

export async function createSite(data: Prisma.SiteCreateInput) {
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
    console.log(`[createSite] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function getSiteById(id: string) {
  const start = performance.now();

  try {
    return prisma.site.findUnique({
      where: { id },
    });
  } finally {
    console.log(`[getSiteById] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function getSiteBySlug(slug: string, excludedId?: string) {
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
    console.log(`[getSiteBySlug] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function getSites() {
  const start = performance.now();

  try {
    const sites = await prisma.site.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return sites;
  } finally {
    console.log(`[getSites] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function updateSite(id: string, data: Prisma.SiteUpdateInput) {
  const start = performance.now();

  try {
    const updatedSite = await prisma.site.update({
      where: { id },
      data,
    });

    return updatedSite;
  } finally {
    console.log(`[updateSite] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function deleteSite(id: string) {
  const start = performance.now();

  try {
    const deletedSite = await prisma.site.delete({
      where: { id },
    });

    return deletedSite;
  } finally {
    console.log(`[deleteSite] ${(performance.now() - start).toFixed(2)}ms`);
  }
}
