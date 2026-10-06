import { AuditLogEntity } from "../database/audit-log.server";

export async function getManyAuditLogs(filters?: {
  entityType?: string;
  entityId?: string;
  action?: string;
  changedBy?: string;
  from?: Date;
  to?: Date;
  query?: string;
  auditDate?: {
    source: "record" | "metadata";
    field: string;
    from?: Date;
    to?: Date;
    fromValue?: string;
    toValue?: string;
  };
  fieldSearch?: {
    source: "record" | "metadata";
    field: string;
    value: string;
  };
}) {
  return AuditLogEntity.findMany(filters);
}
