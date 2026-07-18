import { and, desc, eq } from "drizzle-orm";
import { db } from "../../../db/server";
import { auditLogs } from "../../../db/schema";

export type AuditLogListItem = typeof auditLogs.$inferSelect;

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
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }

  public static async findMany(input?: {
    entityType?: string;
    entityId?: string;
    action?: string;
    changedBy?: string;
  }): Promise<AuditLogListItem[]> {
    const conditions = [];
    if (input?.entityType) conditions.push(eq(auditLogs.entityType, input.entityType));
    if (input?.entityId) conditions.push(eq(auditLogs.entityId, input.entityId));
    if (input?.action) conditions.push(eq(auditLogs.action, input.action));
    if (input?.changedBy) conditions.push(eq(auditLogs.changedBy, input.changedBy));

    const query = db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(500);

    if (conditions.length > 0) {
      return query.where(and(...conditions)).all();
    }
    return query.all();
  }

  public static async findByEntity(entityType: string, entityId: string) {
    return db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
      .orderBy(desc(auditLogs.createdAt))
      .all();
  }
}
