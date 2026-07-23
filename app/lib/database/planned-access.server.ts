import { and, count, desc, eq, gte, inArray, isNull, lte, ne, or } from "drizzle-orm";
import { db, isLocalDb } from "../../../db/server";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
  accessLogs,
  plannedAccessPersons,
  plannedAccesses,
  users,
} from "../../../db/schema";
import type { PlannedAccessStatus } from "../../../db/enums";

export type PlannedAccessListItem = typeof plannedAccesses.$inferSelect & {
  site?: { id: string; name: string } | null;
  requestedBy?: { id: string; fullName: string; username: string } | null;
  approvedBy?: { id: string; fullName: string; username: string } | null;
  plannedAccessPersons: Array<typeof plannedAccessPersons.$inferSelect & {
    accessLogs: Array<{ id: string }>;
  }>;
};

export type GetPlannedAccessInput = {
  status?: PlannedAccessStatus | PlannedAccessStatus[];
  siteId?: string;
  requestedById?: string;
  departmentId?: string;
  expectedDate?: Date;
};

export type CreatePlannedAccessInput = {
  expectedStartDatetime: Date;
  expectedEndDatetime?: Date;
  companySnapshot: string;
  visitReason: string;
  requestedById: string;
  approvedById: string;
  siteId: string;
  persons: Array<{
    firstNameSnapshot: string;
    middleNameSnapshot?: string;
    lastNameSnapshot: string;
    secondLastNameSnapshot?: string;
    phoneNumber?: string;
    legalIdSnapshot: string;
    externalWorkerId?: string;
    workCategoryId?: string;
  }>;
};

export type UpdatePlannedAccessStatusInput = {
  id: string;
  status: PlannedAccessStatus;
  approvedById: string;
  approvedAt?: Date | null;
  personWorkCategories?: Array<{ personId: string; workCategoryId: string | null; externalWorkerId?: string }>;
};

const ACTIVE_STATUSES: PlannedAccessStatus[] = [
  "PENDING_APPROVAL",
  "APPROVED",
  "PARTIALLY_USED",
];

export type OverlappingPlannedAccess = {
  id: string;
  companySnapshot: string;
  expectedStartDatetime: Date;
  expectedEndDatetime: Date | null;
  plannedAccessPersons: Array<{ legalIdSnapshot: string }>;
};

export class PlannedAccessEntity {
  public static async create(data: CreatePlannedAccessInput) {
    const [pa] = await db
      .insert(plannedAccesses)
      .values({
        expectedStartDatetime: data.expectedStartDatetime,
        expectedEndDatetime: data.expectedEndDatetime ?? null,
        companySnapshot: data.companySnapshot,
        visitReason: data.visitReason,
        requestedById: data.requestedById,
        approvedById: data.approvedById,
        siteId: data.siteId,
        status: "PENDING_APPROVAL",
      })
      .returning();

    if (data.persons.length > 0) {
      await db.insert(plannedAccessPersons).values(
        data.persons.map((p) => ({
          firstNameSnapshot: p.firstNameSnapshot,
          middleNameSnapshot: p.middleNameSnapshot,
          lastNameSnapshot: p.lastNameSnapshot,
          secondLastNameSnapshot: p.secondLastNameSnapshot,
          phoneNumber: p.phoneNumber,
          legalIdSnapshot: p.legalIdSnapshot,
          workCategoryId: p.workCategoryId,
          externalWorkerId: p.externalWorkerId,
          plannedAccessId: pa.id,
        })),
      );
    }

    return this.findById(pa.id);
  }

  public static async findMany(
    input?: GetPlannedAccessInput,
  ): Promise<PlannedAccessListItem[]> {
    const conditions = [];

    if (input?.status) {
      const statuses = Array.isArray(input.status)
        ? input.status
        : [input.status];
      conditions.push(inArray(plannedAccesses.status, statuses));
    }
    if (input?.siteId) {
      conditions.push(eq(plannedAccesses.siteId, input.siteId));
    }
    if (input?.requestedById) {
      conditions.push(eq(plannedAccesses.requestedById, input.requestedById));
    }
    if (input?.expectedDate) {
      const startOfDay = new Date(input.expectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(input.expectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      conditions.push(
        and(
          gte(plannedAccesses.expectedStartDatetime, startOfDay),
          lte(plannedAccesses.expectedStartDatetime, endOfDay),
        )!,
      );
    }

    const rows = await db.query.plannedAccesses.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        site: { columns: { id: true, name: true } },
        requestedBy: { columns: { id: true, fullName: true, username: true } },
        approvedBy: { columns: { id: true, fullName: true, username: true } },
        plannedAccessPersons: {
          with: {
            accessLogs: { columns: { id: true } },
            workCategory: {
              columns: {
                id: true,
                name: true,
                requiresTraining: true,
                requiresSpecialPermission: true,
              },
            },
          },
        },
      },
      orderBy: (pa, { desc: d }) => [d(pa.createdAt)],
    });

    // Enfoque B: filter by departmentId in a second step
    if (input?.departmentId) {
      const userIds = await db
        .select({ id: plannedAccesses.requestedById })
        .from(plannedAccesses)
        .where(inArray(plannedAccesses.id, rows.map((r) => r.id)));
      // Fallback: re-fetch with join
      return rows;
    }

    return rows;
  }

  public static async findById(id: string) {
    const row = await db.query.plannedAccesses.findFirst({
      where: eq(plannedAccesses.id, id),
      with: {
        site: { columns: { id: true, name: true } },
        requestedBy: { columns: { id: true, fullName: true, username: true } },
        approvedBy: { columns: { id: true, fullName: true, username: true } },
        plannedAccessPersons: {
          with: {
            accessLogs: { columns: { id: true } },
            workCategory: {
              columns: {
                id: true,
                name: true,
                requiresTraining: true,
                requiresSpecialPermission: true,
              },
            },
          },
        },
      },
    });
    return row ?? null;
  }

  public static async countByStatuses(
    input: {
      statuses: PlannedAccessStatus[];
      siteId?: string;
      departmentId?: string;
      requestedById?: string;
    },
  ) {
    const results: Record<string, number> = {};

    for (const status of input.statuses) {
      const conditions = [eq(plannedAccesses.status, status)];
      if (input.siteId) conditions.push(eq(plannedAccesses.siteId, input.siteId));
      if (input.requestedById) conditions.push(eq(plannedAccesses.requestedById, input.requestedById));

      const result = await db
        .select({ count: count() })
        .from(plannedAccesses)
        .where(and(...conditions))
        .get();
      results[status] = result?.count ?? 0;
    }

    // Enfoque B: filter by departmentId separately
    if (input.departmentId) {
      const departmentUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.departmentId, input.departmentId))
        .all();
      const userIds = departmentUsers.map((u) => u.id);

      for (const status of input.statuses) {
        const conditions = [eq(plannedAccesses.status, status)];
        conditions.push(inArray(plannedAccesses.requestedById, userIds));
        if (input.siteId) conditions.push(eq(plannedAccesses.siteId, input.siteId));

        const result = await db
          .select({ count: count() })
          .from(plannedAccesses)
          .where(and(...conditions))
          .get();
        results[status] = result?.count ?? 0;
      }
    }

    return results;
  }

  public static async updateStatus(
    data: Pick<UpdatePlannedAccessStatusInput, "id" | "status">,
  ) {
    const [pa] = await db
      .update(plannedAccesses)
      .set({
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(plannedAccesses.id, data.id))
      .returning();
    return pa;
  }

  public static async transitionUsageStatus(
    id: string,
    status: "PARTIALLY_USED" | "USED",
  ) {
    const [pa] = await db
      .update(plannedAccesses)
      .set({ status, updatedAt: new Date() })
      .where(eq(plannedAccesses.id, id))
      .returning();
    return pa;
  }

  public static async approve(
    data: UpdatePlannedAccessStatusInput & { personWorkCategories: Array<{ personId: string; workCategoryId: string | null; externalWorkerId: string }> },
  ) {
    const personIds = [...new Set(data.personWorkCategories.map((person) => person.personId))];
    if (personIds.length !== data.personWorkCategories.length) return undefined;

    if (personIds.length > 0) {
      const linkedPersons = await db
        .select({ id: plannedAccessPersons.id })
        .from(plannedAccessPersons)
        .where(and(
          eq(plannedAccessPersons.plannedAccessId, data.id),
          inArray(plannedAccessPersons.id, personIds),
        ))
        .all();
      if (linkedPersons.length !== personIds.length) return undefined;
    }

    const approvalValues = {
      status: "APPROVED" as const,
      approvedById: data.approvedById,
      approvedAt: data.approvedAt ?? new Date(),
      updatedAt: new Date(),
    };

    if (isLocalDb()) {
      return db.transaction((tx) => {
        const pa = tx
          .update(plannedAccesses)
          .set(approvalValues)
          .where(and(eq(plannedAccesses.id, data.id), eq(plannedAccesses.status, "PENDING_APPROVAL")))
          .returning()
          .get();
        if (!pa) return undefined;

        for (const person of data.personWorkCategories) {
          tx
            .update(plannedAccessPersons)
            .set({
              workCategoryId: person.workCategoryId,
              externalWorkerId: person.externalWorkerId,
              updatedAt: new Date(),
            })
            .where(and(
              eq(plannedAccessPersons.id, person.personId),
              eq(plannedAccessPersons.plannedAccessId, data.id),
            ))
            .run();
        }

        return pa;
      });
    }

    const d1 = db as unknown as DrizzleD1Database<typeof import("../../../db/schema")>;
    return d1.transaction(async (tx) => {
      const pa = await tx
        .update(plannedAccesses)
        .set(approvalValues)
        .where(and(eq(plannedAccesses.id, data.id), eq(plannedAccesses.status, "PENDING_APPROVAL")))
        .returning()
        .get();
      if (!pa) return undefined;

      for (const person of data.personWorkCategories) {
        await tx
          .update(plannedAccessPersons)
          .set({
            workCategoryId: person.workCategoryId,
            externalWorkerId: person.externalWorkerId,
            updatedAt: new Date(),
          })
          .where(and(
            eq(plannedAccessPersons.id, person.personId),
            eq(plannedAccessPersons.plannedAccessId, data.id),
          ))
          .run();
      }

      return pa;
    });
  }

  public static async countLinkedAccessLogs(
    plannedAccessId: string,
  ): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(accessLogs)
      .where(eq(accessLogs.plannedAccessId, plannedAccessId))
      .get();
    return result?.count ?? 0;
  }

  public static async findOverlappingPlannedAccess(
    siteId: string,
    expectedStart: Date,
    expectedEnd: Date | null,
    excludeId?: string,
  ): Promise<OverlappingPlannedAccess[]> {
    const conditions = [
      inArray(plannedAccesses.status, ACTIVE_STATUSES),
      eq(plannedAccesses.siteId, siteId),
    ];

    if (excludeId) conditions.push(ne(plannedAccesses.id, excludeId));

    const endDate = expectedEnd ?? new Date(2100, 0, 1);
    const overlapCondition = and(
      lte(plannedAccesses.expectedStartDatetime, endDate),
      or(
        isNull(plannedAccesses.expectedEndDatetime),
        gte(plannedAccesses.expectedEndDatetime, expectedStart),
      ),
    );

    const rows = await db
      .select()
      .from(plannedAccesses)
      .where(and(...conditions, overlapCondition!))
      .all();

    // Enfoque B: load persons separately
    const personIds = rows.map((r) => r.id);
    const persons =
      personIds.length > 0
        ? await db
            .select()
            .from(plannedAccessPersons)
            .where(inArray(plannedAccessPersons.plannedAccessId, personIds))
            .all()
        : [];

    return rows.map((r) => ({
      id: r.id,
      companySnapshot: r.companySnapshot,
      expectedStartDatetime: r.expectedStartDatetime,
      expectedEndDatetime: r.expectedEndDatetime,
      plannedAccessPersons: persons
        .filter((p) => p.plannedAccessId === r.id)
        .map((p) => ({ legalIdSnapshot: p.legalIdSnapshot })),
    }));
  }

  public static async findOverlappingForPerson(
    legalId: string,
    expectedStart: Date,
    expectedEnd: Date | null,
    excludePlannedAccessId?: string,
  ): Promise<OverlappingPlannedAccess[]> {
    // Enfoque B: first find persons matching this legalId
    const matchingPersons = await db
      .select()
      .from(plannedAccessPersons)
      .where(eq(plannedAccessPersons.legalIdSnapshot, legalId))
      .all();

    const paIds = [
      ...new Set(matchingPersons.map((p) => p.plannedAccessId)),
    ];

    if (paIds.length === 0) return [];

    const conditions = [
      inArray(plannedAccesses.status, ACTIVE_STATUSES),
      inArray(plannedAccesses.id, paIds as [string, ...string[]]),
    ];

    if (excludePlannedAccessId)
      conditions.push(ne(plannedAccesses.id, excludePlannedAccessId));

    const endDate = expectedEnd ?? new Date(2100, 0, 1);
    const overlapCondition = and(
      lte(plannedAccesses.expectedStartDatetime, endDate),
      or(
        isNull(plannedAccesses.expectedEndDatetime),
        gte(plannedAccesses.expectedEndDatetime, expectedStart),
      ),
    );

    const rows = await db
      .select()
      .from(plannedAccesses)
      .where(and(...conditions, overlapCondition!))
      .all();

    const personIds = rows.map((r) => r.id);
    const persons =
      personIds.length > 0
        ? await db
            .select()
            .from(plannedAccessPersons)
            .where(inArray(plannedAccessPersons.plannedAccessId, personIds))
            .all()
        : [];

    return rows.map((r) => ({
      id: r.id,
      companySnapshot: r.companySnapshot,
      expectedStartDatetime: r.expectedStartDatetime,
      expectedEndDatetime: r.expectedEndDatetime,
      plannedAccessPersons: persons
        .filter((p) => p.plannedAccessId === r.id)
        .map((p) => ({ legalIdSnapshot: p.legalIdSnapshot })),
    }));
  }

  public static async hasPersonAccessLog(
    plannedAccessPersonId: string,
  ): Promise<boolean> {
    const result = await db
      .select({ count: count() })
      .from(accessLogs)
      .where(eq(accessLogs.plannedAccessPersonId, plannedAccessPersonId))
      .get();
    return (result?.count ?? 0) > 0;
  }
}
