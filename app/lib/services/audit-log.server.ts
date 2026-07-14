import { AuditLogEntity } from "../database/audit-log.server";

export async function getManyAuditLogs(filters?: {
  entityType?: string;
  entityId?: string;
  action?: string;
  changedBy?: string;
}) {
  return AuditLogEntity.findMany(filters);
}
