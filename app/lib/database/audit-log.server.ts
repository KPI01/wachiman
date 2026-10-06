import {
  and,
  desc,
  eq,
  gte,
  getTableColumns,
  ilike,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "../../../db/server";
import { auditLogs, users } from "../../../db/schema";
import {
  AUDIT_METADATA_DATE_FIELDS,
  AUDIT_METADATA_SEARCH_FIELDS,
} from "../audit-log-search";

export type AuditLogListItem = typeof auditLogs.$inferSelect & {
  changedByUsername: string | null;
};

export type CreateAuditLogInput = {
  entityType: string;
  entityId: string;
  action: string;
  changedBy: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

type AuditLogFilters = {
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
};

function containsPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

function buildUserSearchCondition(pattern: string) {
  const matchingUsers = db
    .select({ id: users.id })
    .from(users)
    .where(or(ilike(users.username, pattern), ilike(users.fullName, pattern)));

  return or(
    ilike(auditLogs.changedBy, pattern),
    inArray(auditLogs.changedBy, matchingUsers),
  );
}

function buildGlobalSearchCondition(value: string): SQL | undefined {
  const pattern = containsPattern(value);
  return or(
    ilike(auditLogs.id, pattern),
    ilike(auditLogs.entityType, pattern),
    ilike(auditLogs.entityId, pattern),
    ilike(auditLogs.action, pattern),
    ilike(auditLogs.summary, pattern),
    ilike(sql`to_char(${auditLogs.createdAt}, 'DD/MM/YYYY HH24:MI:SS')`, pattern),
    ilike(sql`${auditLogs.createdAt}::text`, pattern),
    buildUserSearchCondition(pattern),
    ilike(sql`coalesce(${auditLogs.metadata}::text, '')`, pattern),
  );
}

function buildMetadataFieldSearchCondition(field: string, value: string) {
  const pattern = containsPattern(value);
  const definition = AUDIT_METADATA_SEARCH_FIELDS.find(
    (candidate) => candidate.value === field,
  );
  if (!definition) return undefined;

  if (definition.value === "all") {
    return ilike(sql`coalesce(${auditLogs.metadata}::text, '')`, pattern);
  }

  return or(
    ...definition.keys.map((key) =>
      ilike(
        sql`jsonb_path_query_array(${auditLogs.metadata}, ${`lax $.**.${key}`}::jsonpath)::text`,
        pattern,
      ),
    ),
  );
}

function buildRecordFieldSearchCondition(field: string, value: string) {
  const pattern = containsPattern(value);
  switch (field) {
    case "id":
      return ilike(auditLogs.id, pattern);
    case "entityId":
      return ilike(auditLogs.entityId, pattern);
    case "entityType":
      return ilike(auditLogs.entityType, pattern);
    case "action":
      return ilike(auditLogs.action, pattern);
    case "changedBy":
      return buildUserSearchCondition(pattern);
    case "summary":
      return ilike(auditLogs.summary, pattern);
    case "createdAt":
      return or(
        ilike(sql`to_char(${auditLogs.createdAt}, 'DD/MM/YYYY HH24:MI:SS')`, pattern),
        ilike(sql`${auditLogs.createdAt}::text`, pattern),
      );
    default:
      return undefined;
  }
}

function buildMetadataDateSearchCondition(
  field: string,
  fromValue?: string,
  toValue?: string,
) {
  const dateField = AUDIT_METADATA_DATE_FIELDS.find(
    (candidate) => candidate.value === field,
  );
  if (!dateField) return undefined;

  const paths = dateField.value === "all"
    ? ["lax $.**"]
    : [`lax $.**.${dateField.value}`];

  return or(
    ...paths.map((jsonPath) => {
      const dateValue = sql`left(audit_date.value #>> '{}', 10)`;
      const rangeConditions: SQL[] = [
        sql`${dateValue} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`,
      ];
      if (fromValue) rangeConditions.push(gte(dateValue, fromValue));
      if (toValue) rangeConditions.push(lte(dateValue, toValue));

      return sql`EXISTS (
        SELECT 1
        FROM jsonb_path_query(${auditLogs.metadata}, ${jsonPath}::jsonpath) AS audit_date(value)
        WHERE ${and(...rangeConditions)}
      )`;
    }),
  );
}

export class AuditLogEntity {
  public static async create(data: CreateAuditLogInput) {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }

  public static async findMany(input?: AuditLogFilters): Promise<AuditLogListItem[]> {
    const conditions = [];
    if (input?.entityType) conditions.push(eq(auditLogs.entityType, input.entityType));
    if (input?.entityId) conditions.push(eq(auditLogs.entityId, input.entityId));
    if (input?.action) conditions.push(eq(auditLogs.action, input.action));
    if (input?.changedBy) conditions.push(eq(auditLogs.changedBy, input.changedBy));
    if (input?.from) conditions.push(gte(auditLogs.createdAt, input.from));
    if (input?.to) conditions.push(lte(auditLogs.createdAt, input.to));
    if (input?.query?.trim()) {
      const globalSearch = buildGlobalSearchCondition(input.query.trim());
      if (globalSearch) conditions.push(globalSearch);
    }

    if (input?.fieldSearch?.value.trim()) {
      const { source, field, value } = input.fieldSearch;
      const condition = source === "metadata"
        ? buildMetadataFieldSearchCondition(field, value.trim())
        : buildRecordFieldSearchCondition(field, value.trim());
      if (condition) conditions.push(condition);
    }

    if (input?.auditDate) {
      const dateFilter = input.auditDate;
      if (dateFilter.source === "record" && dateFilter.field === "createdAt") {
        if (dateFilter.from) conditions.push(gte(auditLogs.createdAt, dateFilter.from));
        if (dateFilter.to) conditions.push(lte(auditLogs.createdAt, dateFilter.to));
      } else if (dateFilter.source === "metadata") {
        const condition = buildMetadataDateSearchCondition(
          dateFilter.field,
          dateFilter.fromValue,
          dateFilter.toValue,
        );
        if (condition) conditions.push(condition);
      }
    }

    const query = db
      .select({ ...getTableColumns(auditLogs), changedByUsername: users.username })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.changedBy))
      .orderBy(desc(auditLogs.createdAt));

    if (conditions.length > 0) {
      return query.where(and(...conditions)).limit(500);
    }
    return query.limit(500);
  }

  public static async findByEntity(entityType: string, entityId: string) {
    return db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
      .orderBy(desc(auditLogs.createdAt));
  }
}
