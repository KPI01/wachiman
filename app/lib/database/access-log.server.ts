import { and, count, desc, eq, gte, inArray, isNotNull, isNull, lte, ne, or, sql, type SQL } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { db, isLocalDb } from "../../../db/server";
import {
  accessLogs,
  accessLogVehicles,
  auditLogs,
  plannedAccessPersons,
  plannedAccesses,
  sites,
  users,
} from "../../../db/schema";
import type { CreateAuditLogInput } from "./audit-log.server";

export type AccessLogListItem = typeof accessLogs.$inferSelect & {
  site?: { id: string; name: string } | null;
  createdBy?: { id: string; fullName: string; username: string } | null;
  vehicleAccessLog?: typeof accessLogVehicles.$inferSelect | null;
};

type AccessLogTimestampField = "entryTimestamp" | "exitTimestamp";

type AccessLogDateFilter =
  | { date: Date; from?: never; to?: never }
  | { date?: never; from: Date; to: Date };

export type GetAccessLogsInput = {
  siteId?: string;
  timestampField?: AccessLogTimestampField;
  exitTimestamp?: Date | null | { not: null };
} & AccessLogDateFilter;

type AccessLogFindFirstInput = {
  entryTimestamp?: Date;
  exitTimestamp?: Date | boolean;
} & ({ id: string; legalId?: never } | { id?: never; legalId: string });

export type CreateAccessLogInput = {
  entryTimestamp: Date;
  entrySignatureEnvelope: Record<string, unknown>;
  companyNameSnapshot: string;
  firstNameSnapshot: string;
  middleNameSnapshot?: string;
  lastNameSnapshot: string;
  secondLastNameSnapshot?: string;
  phoneNumber?: string;
  legalIdSnapshot: string;
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
};

export type MarkAccessLogExitInput = {
  accessLogId: string;
  exitSignatureEnvelope: Record<string, unknown>;
  exitRecordedById: string;
  siteId?: string;
};

export type UpdateAccessLogInput = {
  entryTimestamp: Date;
  exitTimestamp: Date | null;
  exitSignatureEnvelope: Record<string, unknown> | null;
  exitRecordedById: string | null;
  companyNameSnapshot: string;
  firstNameSnapshot: string;
  middleNameSnapshot: string | null;
  lastNameSnapshot: string;
  secondLastNameSnapshot: string | null;
  phoneNumber: string | null;
  legalIdSnapshot: string;
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
  return {
    gte: input.from,
    lte: input.to,
  };
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
      ? db.select().from(sites).where(inArray(sites.id, siteIds)).all()
      : Promise.resolve([] as typeof sites.$inferSelect[]),
    creatorIds.length > 0
      ? db.select().from(users).where(inArray(users.id, creatorIds)).all()
      : Promise.resolve([] as typeof users.$inferSelect[]),
    vehicleIds.length > 0
      ? db.select().from(accessLogVehicles).where(inArray(accessLogVehicles.id, vehicleIds)).all()
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

    const [log] = await db
      .insert(accessLogs)
      .values({
        entryTimestamp: data.entryTimestamp,
        entrySignatureEnvelope: data.entrySignatureEnvelope,
        companyNameSnapshot: data.companyNameSnapshot,
        firstNameSnapshot: data.firstNameSnapshot,
        middleNameSnapshot: data.middleNameSnapshot,
        lastNameSnapshot: data.lastNameSnapshot,
        secondLastNameSnapshot: data.secondLastNameSnapshot,
        phoneNumber: data.phoneNumber,
        legalIdSnapshot: data.legalIdSnapshot,
        withVehicle: data.withVehicle,
        visitReason: data.visitReason,
        siteId: data.siteId,
        createdById: data.createdById,
        externalWorkerId: data.externalWorkerId,
        vehicleAccessLogId: vehicleId,
        plannedAccessId: data.plannedAccessId,
        plannedAccessPersonId: data.plannedAccessPersonId,
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

    const [log] = await db
      .update(accessLogs)
      .set({
        exitTimestamp: new Date(),
        exitSignatureEnvelope: data.exitSignatureEnvelope,
        exitRecordedById: data.exitRecordedById,
      })
      .where(and(...conditions))
      .returning();
    return log;
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

    if (isLocalDb()) {
      return db.transaction((tx) => {
        const log = tx
          .update(accessLogs)
          .set(data)
          .where(and(...conditions))
          .returning()
          .get();
        if (!log) return undefined;

        tx.insert(auditLogs).values(auditData).run();
        return log;
      });
    }

    const d1 = db as unknown as DrizzleD1Database<
      typeof import("../../../db/schema")
    >;
    const updateClaim = `__access_log_update_${crypto.randomUUID()}__`;
    const claimedRow = and(
      eq(accessLogs.id, accessLogId),
      eq(accessLogs.visitReason, updateClaim),
    );
    const auditInsert = d1.insert(auditLogs).select(sql`
      SELECT
        ${crypto.randomUUID()},
        ${auditData.entityType},
        ${auditData.entityId},
        ${auditData.action},
        ${auditData.changedBy},
        ${auditData.summary},
        ${auditData.metadata ? JSON.stringify(auditData.metadata) : null},
        ${Date.now()}
      FROM ${accessLogs}
      WHERE ${claimedRow}
    `);
    const [, , updatedRows] = await d1.batch([
      d1
        .update(accessLogs)
        .set({ visitReason: updateClaim })
        .where(and(...conditions))
        .returning(),
      auditInsert,
      d1.update(accessLogs).set(data).where(claimedRow).returning(),
    ] as const);

    return updatedRows[0];
  }

  public static async findMany(
    input: GetAccessLogsInput = { date: new Date() },
  ): Promise<AccessLogListItem[]> {
    const conditions: SQL[] = [];
    const timestampField = input.timestampField ?? "entryTimestamp";
    const range = getTimestampRangeFilter(input);

    if (input.siteId) conditions.push(eq(accessLogs.siteId, input.siteId));
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

    conditions.push(gte(timestampCol, range.gte));
    conditions.push(lte(timestampCol, range.lte));

    const rows = await db
      .select()
      .from(accessLogs)
      .where(and(...conditions))
      .orderBy(desc(accessLogs.entryTimestamp))
      .all();

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
      .get();

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
      .get();

    if (!row) return null;
    return (await loadAccessLogRelations([row]))[0] ?? null;
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
      .get();

    if (!row) return null;
    return (await loadAccessLogRelations([row]))[0] ?? null;
  }

  public static async hasVehicle(vehicleId: string) {
    const row = await db
      .select({ id: accessLogs.id })
      .from(accessLogs)
      .where(eq(accessLogs.vehicleAccessLogId, vehicleId))
      .limit(1)
      .get();
    return row !== undefined;
  }

  public static async getVehicle(vehicleId: string) {
    const vehicle = await db
      .select()
      .from(accessLogVehicles)
      .where(eq(accessLogVehicles.id, vehicleId))
      .get();
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
      .get();
    return result?.count ?? 0;
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
      .get();

    if (!row) return null;
    return (await loadAccessLogRelations([row]))[0] ?? null;
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
      .where(eq(users.departmentId, departmentId))
      .all();
    const userIds = departmentUsers.map((u) => u.id);
    if (userIds.length === 0) return [];

    // 2. Find plannedAccesses requested by these users
    const deptPlannedAccesses = await db
      .select({ id: plannedAccesses.id })
      .from(plannedAccesses)
      .where(inArray(plannedAccesses.requestedById, userIds))
      .all();
    const paIds = deptPlannedAccesses.map((pa) => pa.id);
    if (paIds.length === 0) return [];

    // 3. Find plannedAccessPerson records linked to these plannedAccesses
    const paPersons = await db
      .select({ id: plannedAccessPersons.id })
      .from(plannedAccessPersons)
      .where(inArray(plannedAccessPersons.plannedAccessId, paIds))
      .all();
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
      .orderBy(desc(accessLogs.entryTimestamp))
      .all();

    return loadAccessLogRelations(rows);
  }
}
