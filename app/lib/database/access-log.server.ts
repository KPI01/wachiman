import { and, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, like, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "../../../db/server";
import {
  accessLogs,
  accessLogVehicles,
  auditLogs,
  allowedAreas,
  plannedAccessPersons,
  plannedAccesses,
  sites,
  users,
} from "../../../db/schema";
import type { CreateAuditLogInput } from "./audit-log.server";
import type { AccessLogExitMethod } from "../../../db/enums";

export type AccessLogListItem = typeof accessLogs.$inferSelect & {
  site?: { id: string; name: string } | null;
  createdBy?: { id: string; fullName: string; username: string } | null;
  vehicleAccessLog?: typeof accessLogVehicles.$inferSelect | null;
};

type AccessLogTimestampField = "entryTimestamp" | "exitTimestamp";

type AccessLogDateFilter =
  | { date?: Date; from?: never; to?: never }
  | { date?: never; from: Date; to: Date };

export type GetAccessLogsInput = {
  siteId?: string;
  timestampField?: AccessLogTimestampField;
  exitTimestamp?: Date | null | { not: null };
  query?: string;
  companyName?: string;
  allowedAreaId?: string;
  legalId?: string;
  approvedBy?: string;
  vehicleQuery?: string;
} & AccessLogDateFilter;

type AccessLogFindFirstInput = {
  entryTimestamp?: Date;
  exitTimestamp?: Date | boolean;
} & ({ id: string; legalId?: never } | { id?: never; legalId: string });

export type CreateAccessLogInput = {
  entryTimestamp: Date;
  entrySignatureEnvelope: Record<string, unknown>;
  riskAcknowledgedAt?: Date;
  riskAcknowledgementSnapshot?: Record<string, unknown>;
  companyNameSnapshot: string;
  companyId?: string;
  firstNameSnapshot: string;
  middleNameSnapshot?: string;
  lastNameSnapshot: string;
  secondLastNameSnapshot?: string;
  phoneNumber?: string;
  legalIdSnapshot: string;
  allowedAreaSnapshot: string;
  allowedAreaId?: string;
  approvedBySnapshot: string;
  withVehicle: boolean;
  visitReason: string;
  siteId: string;
  createdById: string;
  externalWorkerId?: string;
  vehicle?: {
    typeSnapshot: string;
    brandSnapshot?: string;
    modelSnapshot?: string;
    plateSnapshot: string;
  };
  plannedAccessId?: string;
  plannedAccessPersonId?: string;
  workPermitId?: string;
};

export type MarkAccessLogExitInput = {
  accessLogId: string;
  exitTimestamp: Date;
  exitSignatureEnvelope: Record<string, unknown> | null;
  exitRecordedById: string | null;
  exitClosureMethod: AccessLogExitMethod;
  auditData: CreateAuditLogInput;
  siteId?: string;
};

export type RequestAccessLogExitSignatureInput = {
  accessLogId: string;
  exitSignatureRequestedAt: Date;
  exitSignatureRequestedById: string;
  auditData: CreateAuditLogInput;
  siteId?: string;
};

export type UpdateAccessLogInput = {
  entryTimestamp: Date;
  exitTimestamp: Date | null;
  exitSignatureEnvelope: Record<string, unknown> | null;
  exitClosureMethod: AccessLogExitMethod | null;
  exitRecordedById: string | null;
  companyNameSnapshot: string;
  firstNameSnapshot: string;
  middleNameSnapshot: string | null;
  lastNameSnapshot: string;
  secondLastNameSnapshot: string | null;
  phoneNumber: string | null;
  legalIdSnapshot: string;
  allowedAreaSnapshot: string;
  allowedAreaId?: string | null;
  approvedBySnapshot: string;
  visitReason: string;
  externalWorkerId: string | null;
};

function getTimestampRangeFilter(input: AccessLogDateFilter) {
  if ("date" in input && input.date) {
    const start = new Date(input.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(input.date);
    end.setHours(23, 59, 59, 999);
    return { gte: start, lte: end };
  }
  if (input.from && input.to) return { gte: input.from, lte: input.to };
  return {};
}

async function loadAccessLogRelations(rows: (typeof accessLogs.$inferSelect)[]):
  Promise<AccessLogListItem[]> {
  if (rows.length === 0) return [];

  const siteIds = [...new Set(rows.map((r) => r.siteId).filter(Boolean))];
  const creatorIds = [
    ...new Set(rows.map((r) => r.createdById).filter(Boolean)),
  ];
  const vehicleIds = [
    ...new Set(
      rows
        .map((r) => r.vehicleAccessLogId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [siteRows, creatorRows, vehicleRows] = await Promise.all([
    siteIds.length > 0
      ? db.select().from(sites).where(inArray(sites.id, siteIds))
      : Promise.resolve([] as typeof sites.$inferSelect[]),
    creatorIds.length > 0
      ? db.select().from(users).where(inArray(users.id, creatorIds))
      : Promise.resolve([] as typeof users.$inferSelect[]),
    vehicleIds.length > 0
      ? db.select().from(accessLogVehicles).where(inArray(accessLogVehicles.id, vehicleIds))
      : Promise.resolve([] as typeof accessLogVehicles.$inferSelect[]),
  ]);

  const siteMap = new Map(siteRows.map((s) => [s.id, s]));
  const creatorMap = new Map(creatorRows.map((c) => [c.id, c]));
  const vehicleMap = new Map(vehicleRows.map((v) => [v.id, v]));

  return rows.map((r) => ({
    ...r,
    site: siteMap.get(r.siteId) ?? null,
    createdBy: creatorMap.get(r.createdById) ?? null,
    vehicleAccessLog: r.vehicleAccessLogId
      ? (vehicleMap.get(r.vehicleAccessLogId) ?? null)
      : null,
  })) as AccessLogListItem[];
}

export class AccessLogEntity {
  public static async create(data: CreateAccessLogInput) {
    let vehicleId: string | undefined;

    if (data.withVehicle && data.vehicle) {
      const existingVehicle = await db
        .select({ id: accessLogVehicles.id })
        .from(accessLogVehicles)
        .where(eq(accessLogVehicles.plateSnapshot, data.vehicle.plateSnapshot))
        .limit(1)
        .then((rows) => rows[0]);

      if (existingVehicle) {
        vehicleId = existingVehicle.id;
      } else {
        const [vehicle] = await db
          .insert(accessLogVehicles)
          .values({
            typeSnapshot: data.vehicle.typeSnapshot,
            brandSnapshot: data.vehicle.brandSnapshot,
            modelSnapshot: data.vehicle.modelSnapshot,
            plateSnapshot: data.vehicle.plateSnapshot,
          })
          .returning();
        vehicleId = vehicle.id;
      }
    }

    const [log] = await db
      .insert(accessLogs)
      .values({
        entryTimestamp: data.entryTimestamp,
        entrySignatureEnvelope: data.entrySignatureEnvelope,
        riskAcknowledgedAt: data.riskAcknowledgedAt,
        riskAcknowledgementSnapshot: data.riskAcknowledgementSnapshot,
        companyNameSnapshot: data.companyNameSnapshot,
        companyId: data.companyId,
        firstNameSnapshot: data.firstNameSnapshot,
        middleNameSnapshot: data.middleNameSnapshot,
        lastNameSnapshot: data.lastNameSnapshot,
        secondLastNameSnapshot: data.secondLastNameSnapshot,
        phoneNumber: data.phoneNumber,
        legalIdSnapshot: data.legalIdSnapshot,
        allowedAreaSnapshot: data.allowedAreaSnapshot,
        allowedAreaId: data.allowedAreaId,
        approvedBySnapshot: data.approvedBySnapshot,
        withVehicle: data.withVehicle,
        visitReason: data.visitReason,
        siteId: data.siteId,
        createdById: data.createdById,
        externalWorkerId: data.externalWorkerId,
        vehicleAccessLogId: vehicleId,
        plannedAccessId: data.plannedAccessId,
        plannedAccessPersonId: data.plannedAccessPersonId,
        workPermitId: data.workPermitId,
      })
      .returning();

    return log;
  }

  public static async markExit(data: MarkAccessLogExitInput) {
    const conditions = [
      eq(accessLogs.id, data.accessLogId),
      isNull(accessLogs.exitTimestamp),
    ];
    if (data.siteId) conditions.push(eq(accessLogs.siteId, data.siteId));

    return db.transaction(async (tx) => {
      const [log] = await tx
        .update(accessLogs)
        .set({
          exitTimestamp: data.exitTimestamp,
          exitSignatureEnvelope: data.exitSignatureEnvelope,
          exitClosureMethod: data.exitClosureMethod,
          exitRecordedById: data.exitRecordedById,
        })
        .where(and(...conditions))
        .returning();
      if (!log) return undefined;

      await tx.insert(auditLogs).values(data.auditData);
      return log;
    });
  }

  public static async requestExitSignature(
    data: RequestAccessLogExitSignatureInput,
  ) {
    const conditions = [
      eq(accessLogs.id, data.accessLogId),
      isNull(accessLogs.exitTimestamp),
      isNull(accessLogs.exitSignatureRequestedAt),
    ];
    if (data.siteId) conditions.push(eq(accessLogs.siteId, data.siteId));

    return db.transaction(async (tx) => {
      const [log] = await tx
        .update(accessLogs)
        .set({
          exitSignatureRequestedAt: data.exitSignatureRequestedAt,
          exitSignatureRequestedById: data.exitSignatureRequestedById,
        })
        .where(and(...conditions))
        .returning();
      if (!log) return undefined;

      await tx.insert(auditLogs).values(data.auditData);
      return log;
    });
  }

  public static async updateWithAudit(
    accessLogId: string,
    data: UpdateAccessLogInput,
    auditData: CreateAuditLogInput,
    expectedTimestamps: {
      entryTimestamp: Date;
      exitTimestamp: Date | null;
    },
    siteId?: string,
  ) {
    const conditions = [
      eq(accessLogs.id, accessLogId),
      eq(accessLogs.entryTimestamp, expectedTimestamps.entryTimestamp),
      expectedTimestamps.exitTimestamp === null
        ? isNull(accessLogs.exitTimestamp)
        : eq(accessLogs.exitTimestamp, expectedTimestamps.exitTimestamp),
    ];
    if (siteId) conditions.push(eq(accessLogs.siteId, siteId));

    return db.transaction(async (tx) => {
      const [log] = await tx
        .update(accessLogs)
        .set(data)
        .where(and(...conditions))
        .returning();
      if (!log) return undefined;

      await tx.insert(auditLogs).values(auditData);
      return log;
    });
  }

  public static async findMany(
    input: GetAccessLogsInput = { date: new Date() },
  ): Promise<AccessLogListItem[]> {
    const conditions: SQL[] = [];
    const timestampField = input.timestampField ?? "entryTimestamp";
    const range = getTimestampRangeFilter(input);

    if (input.siteId) conditions.push(eq(accessLogs.siteId, input.siteId));
    if (input.companyName) conditions.push(eq(accessLogs.companyNameSnapshot, input.companyName));
    if (input.allowedAreaId) conditions.push(eq(accessLogs.allowedAreaId, input.allowedAreaId));
    if (input.legalId?.trim()) conditions.push(ilike(accessLogs.legalIdSnapshot, `%${input.legalId.trim()}%`));
    if (input.approvedBy?.trim()) conditions.push(ilike(accessLogs.approvedBySnapshot, `%${input.approvedBy.trim()}%`));
    if (input.vehicleQuery?.trim()) {
      const value = `%${input.vehicleQuery.trim()}%`;
      const matchingVehicles = await db.select({ id: accessLogVehicles.id })
        .from(accessLogVehicles)
        .where(or(
          ilike(accessLogVehicles.plateSnapshot, value),
          ilike(accessLogVehicles.brandSnapshot, value),
          ilike(accessLogVehicles.modelSnapshot, value),
        ));
      if (matchingVehicles.length) conditions.push(inArray(accessLogs.vehicleAccessLogId, matchingVehicles.map((vehicle) => vehicle.id)));
      else conditions.push(sql`false`);
    }
    if (input.query?.trim()) {
      const query = `%${input.query.trim()}%`;
      const matchingVehicles = await db.select({ id: accessLogVehicles.id })
        .from(accessLogVehicles)
        .where(or(
          ilike(accessLogVehicles.plateSnapshot, query),
          ilike(accessLogVehicles.brandSnapshot, query),
          ilike(accessLogVehicles.modelSnapshot, query),
        ));
      const queryConditions = [
        ilike(accessLogs.firstNameSnapshot, query),
        ilike(accessLogs.lastNameSnapshot, query),
        ilike(accessLogs.legalIdSnapshot, query),
        ilike(accessLogs.companyNameSnapshot, query),
        ilike(accessLogs.allowedAreaSnapshot, query),
        ilike(accessLogs.visitReason, query),
      ];
      if (matchingVehicles.length) queryConditions.push(inArray(accessLogs.vehicleAccessLogId, matchingVehicles.map((vehicle) => vehicle.id)));
      conditions.push(or(...queryConditions)!);
    }
    if (input.exitTimestamp !== undefined) {
      if (input.exitTimestamp === null) {
        conditions.push(isNull(accessLogs.exitTimestamp));
      } else if (input.exitTimestamp instanceof Date) {
        conditions.push(eq(accessLogs.exitTimestamp, input.exitTimestamp));
      } else {
        conditions.push(isNotNull(accessLogs.exitTimestamp));
      }
    }

    const timestampCol =
      timestampField === "entryTimestamp"
        ? accessLogs.entryTimestamp
        : accessLogs.exitTimestamp;

    if (range.gte) conditions.push(gte(timestampCol, range.gte));
    if (range.lte) conditions.push(lte(timestampCol, range.lte));

    const rows = await db
      .select()
      .from(accessLogs)
      .where(and(...conditions))
      .orderBy(desc(accessLogs.entryTimestamp));

    return loadAccessLogRelations(rows);
  }

  public static async findOpen(input: { siteId?: string } = {}) {
    const conditions = [isNull(accessLogs.exitTimestamp)];
    if (input.siteId) conditions.push(eq(accessLogs.siteId, input.siteId));

    const rows = await db
      .select()
      .from(accessLogs)
      .where(and(...conditions))
      .orderBy(desc(accessLogs.entryTimestamp));

    return loadAccessLogRelations(rows);
  }

  public static async findOpenByLegalId(legalId: string) {
    const row = await db
      .select()
      .from(accessLogs)
      .where(
        and(
          eq(accessLogs.legalIdSnapshot, legalId),
          isNull(accessLogs.exitTimestamp),
        ),
      )
      .orderBy(desc(accessLogs.entryTimestamp))
      .limit(1)
      .then((rows) => rows[0]);

    if (!row) return null;
    return (await loadAccessLogRelations([row]))[0] ?? null;
  }

  public static async findOpenByLegalIdInSite(
    legalId: string,
    siteId: string,
    excludedAccessLogId?: string,
  ) {
    const conditions = [
      eq(accessLogs.legalIdSnapshot, legalId),
      eq(accessLogs.siteId, siteId),
      isNull(accessLogs.exitTimestamp),
    ];
    if (excludedAccessLogId) {
      conditions.push(ne(accessLogs.id, excludedAccessLogId));
    }

    const row = await db
      .select()
      .from(accessLogs)
      .where(
        and(...conditions),
      )
      .orderBy(desc(accessLogs.entryTimestamp))
      .limit(1)
      .then((rows) => rows[0]);

    if (!row) return null;
    return (await loadAccessLogRelations([row]))[0] ?? null;
  }

  public static async hasAccessOnDate(legalId: string, siteId: string, date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return Boolean(await db
      .select({ id: accessLogs.id })
      .from(accessLogs)
      .where(and(
        eq(accessLogs.legalIdSnapshot, legalId),
        eq(accessLogs.siteId, siteId),
        gte(accessLogs.entryTimestamp, start),
        lte(accessLogs.entryTimestamp, end),
      ))
      .limit(1)
      .then((rows) => rows[0]));
  }

  public static async findFirst(input: AccessLogFindFirstInput) {
    const conditions = [];

    if ("id" in input && input.id) {
      conditions.push(eq(accessLogs.id, input.id));
    }
    if ("legalId" in input && input.legalId) {
      conditions.push(eq(accessLogs.legalIdSnapshot, input.legalId));
    }
    if (input.entryTimestamp) {
      conditions.push(
        gte(accessLogs.entryTimestamp, input.entryTimestamp),
      );
    }
    if (input.exitTimestamp !== undefined) {
      if (input.exitTimestamp === true) {
        conditions.push(isNull(accessLogs.exitTimestamp));
      } else if (input.exitTimestamp instanceof Date) {
        conditions.push(eq(accessLogs.exitTimestamp, input.exitTimestamp));
      }
    }

    const row = await db
      .select()
      .from(accessLogs)
      .where(and(...conditions))
      .limit(1)
      .then((rows) => rows[0]);

    if (!row) return null;
    return (await loadAccessLogRelations([row]))[0] ?? null;
  }

  public static async searchDistinctAllowedAreas(query: string) {
    return db
      .selectDistinct({ id: allowedAreas.id, name: allowedAreas.name })
      .from(allowedAreas)
      .where(like(allowedAreas.name, `%${query}%`))
      .limit(8);
  }

  public static async searchDistinctApprovedBy(query: string) {
    return db
      .selectDistinct({ name: accessLogs.approvedBySnapshot })
      .from(accessLogs)
      .where(like(accessLogs.approvedBySnapshot, `%${query}%`))
      .limit(8);
  }

  public static async hasVehicle(vehicleId: string) {
    const row = await db
      .select({ id: accessLogs.id })
      .from(accessLogs)
      .where(eq(accessLogs.vehicleAccessLogId, vehicleId))
      .limit(1)
      .then((rows) => rows[0]);
    return row !== undefined;
  }

  public static async getVehicle(vehicleId: string) {
    const vehicle = await db
      .select()
      .from(accessLogVehicles)
      .where(eq(accessLogVehicles.id, vehicleId))
      .then((rows) => rows[0]);
    return vehicle ?? null;
  }

  public static async countByEntryDate(
    input: { date: Date; siteId?: string } = { date: new Date() },
  ) {
    const start = new Date(input.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(input.date);
    end.setHours(23, 59, 59, 999);

    const conditions = [
      gte(accessLogs.entryTimestamp, start),
      lte(accessLogs.entryTimestamp, end),
    ];
    if (input.siteId) conditions.push(eq(accessLogs.siteId, input.siteId));

    const result = await db
      .select({ count: count() })
      .from(accessLogs)
      .where(and(...conditions))
      .then((rows) => rows[0]);
    return result?.count ?? 0;
  }

  public static async countByEntryDateGroupedBySite(date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return db
      .select({
        siteId: accessLogs.siteId,
        siteName: sites.name,
        count: count(),
      })
      .from(accessLogs)
      .innerJoin(sites, eq(accessLogs.siteId, sites.id))
      .where(and(
        gte(accessLogs.entryTimestamp, start),
        lte(accessLogs.entryTimestamp, end),
      ))
      .groupBy(accessLogs.siteId, sites.name)
      .orderBy(sites.name);
  }

  public static async findLatestEntry(
    input: { siteId?: string } = {},
  ) {
    const conditions = [];
    if (input.siteId) conditions.push(eq(accessLogs.siteId, input.siteId));

    const row = await db
      .select()
      .from(accessLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(accessLogs.entryTimestamp))
      .limit(1)
      .then((rows) => rows[0]);

    if (!row) return null;
    return (await loadAccessLogRelations([row]))[0] ?? null;
  }

  public static async findLatestEntriesBySite(
    input: { siteId?: string } = {},
  ) {
    const rows = await db
      .selectDistinctOn([accessLogs.siteId])
      .from(accessLogs)
      .where(input.siteId ? eq(accessLogs.siteId, input.siteId) : undefined)
      .orderBy(
        accessLogs.siteId,
        desc(accessLogs.entryTimestamp),
        desc(accessLogs.id),
      );

    return loadAccessLogRelations(rows);
  }

  public static async findPeopleInsideByDepartment(
    departmentId: string,
    siteId: string,
  ): Promise<AccessLogListItem[]> {
    // Enfoque B: separate queries
    // 1. Find users in this department
    const departmentUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.departmentId, departmentId));
    const userIds = departmentUsers.map((u) => u.id);
    if (userIds.length === 0) return [];

    // 2. Find plannedAccesses requested by these users
    const deptPlannedAccesses = await db
      .select({ id: plannedAccesses.id })
      .from(plannedAccesses)
      .where(inArray(plannedAccesses.requestedById, userIds));
    const paIds = deptPlannedAccesses.map((pa) => pa.id);
    if (paIds.length === 0) return [];

    // 3. Find plannedAccessPerson records linked to these plannedAccesses
    const paPersons = await db
      .select({ id: plannedAccessPersons.id })
      .from(plannedAccessPersons)
      .where(inArray(plannedAccessPersons.plannedAccessId, paIds));
    const papIds = paPersons.map((p) => p.id);

    // 4. Query accessLogs with either plannedAccessId OR plannedAccessPersonId matching
    const conditions = [
      isNull(accessLogs.exitTimestamp),
      eq(accessLogs.siteId, siteId),
    ];

    if (paIds.length > 0 && papIds.length > 0) {
      conditions.push(
        or(
          inArray(accessLogs.plannedAccessId, paIds),
          inArray(accessLogs.plannedAccessPersonId, papIds),
        )!,
      );
    } else if (paIds.length > 0) {
      conditions.push(inArray(accessLogs.plannedAccessId, paIds));
    } else if (papIds.length > 0) {
      conditions.push(inArray(accessLogs.plannedAccessPersonId, papIds));
    }

    const rows = await db
      .select()
      .from(accessLogs)
      .where(and(...conditions))
      .orderBy(desc(accessLogs.entryTimestamp));

    return loadAccessLogRelations(rows);
  }
}
