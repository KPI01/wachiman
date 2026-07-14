import type { Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../prisma.server";

export type AuditLogListItem = Prisma.AuditLogGetPayload<object>;

export type CreateAuditLogInput = {
  entityType: string;
  entityId: string;
  action: string;
  changedBy: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

export class AuditLogEntity {
  public static async create(data: CreateAuditLogInput) {
    return prisma.auditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        changedBy: data.changedBy,
        summary: data.summary,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  public static async findMany(input?: {
    entityType?: string;
    entityId?: string;
    action?: string;
    changedBy?: string;
  }): Promise<AuditLogListItem[]> {
    return prisma.auditLog.findMany({
      where: input
        ? {
            ...(input.entityType ? { entityType: input.entityType } : {}),
            ...(input.entityId ? { entityId: input.entityId } : {}),
            ...(input.action ? { action: input.action } : {}),
            ...(input.changedBy ? { changedBy: input.changedBy } : {}),
          }
        : {},
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  public static async findByEntity(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
    });
  }
}
