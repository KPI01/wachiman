import { and, count, desc, eq, gte, inArray, isNull, lte, ne, or } from "drizzle-orm";
import { db, isLocalDb } from "../../../db/server";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
  accessLogs,
  plannedAccessPersons,
  plannedAccesses,
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
  departmentId: string;
  approvedById?: string;
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
  decisionReason: string | null;
  decisionById: string;
  decisionAt?: Date;
  personWorkCategories?: Array<{ personId: string; workCategoryId: string | null; externalWorkerId?: string }>;
};

export type UpdatePendingPlannedAccessInput = {
  id: string;
  expectedUpdatedAt: Date;
  expectedStartDatetime: Date;
  expectedEndDatetime: Date | null;
  companySnapshot: string;
  visitReason: string;
  siteId: string;
  persons: Array<{
    id?: string;
    firstNameSnapshot: string;
    middleNameSnapshot?: string;
    lastNameSnapshot: string;
    secondLastNameSnapshot?: string;
    phoneNumber?: string;
    legalIdSnapshot: string;
    externalWorkerId?: string;
  }>;
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
        departmentId: data.departmentId,
        approvedById: data.approvedById ?? null,
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
    if (input?.departmentId) {
      conditions.push(eq(plannedAccesses.departmentId, input.departmentId));
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
      if (input.departmentId) conditions.push(eq(plannedAccesses.departmentId, input.departmentId));

      const result = await db
        .select({ count: count() })
        .from(plannedAccesses)
        .where(and(...conditions))
        .get();
      results[status] = result?.count ?? 0;
    }

    return results;
  }

  public static async updateStatus(
    data: Pick<UpdatePlannedAccessStatusInput, "id" | "status" | "decisionReason" | "decisionById" | "decisionAt">,
  ) {
    const [pa] = await db
      .update(plannedAccesses)
      .set({
        status: data.status,
        decisionReason: data.decisionReason,
        decisionById: data.decisionById,
        decisionAt: data.decisionAt ?? new Date(),
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

  public static async updatePending(
    data: UpdatePendingPlannedAccessInput,
  ): Promise<
    | { kind: "updated"; id: string }
    | { kind: "conflict" }
    | { kind: "linked-person"; personId: string }
  > {
    const updateValues = {
      expectedStartDatetime: data.expectedStartDatetime,
      expectedEndDatetime: data.expectedEndDatetime,
      companySnapshot: data.companySnapshot,
      visitReason: data.visitReason,
      siteId: data.siteId,
      updatedAt: new Date(),
    };

    const submittedIds = new Set(
      data.persons.flatMap((person) => person.id ? [person.id] : []),
    );
    const getPersonValues = (person: UpdatePendingPlannedAccessInput["persons"][number]) => ({
      firstNameSnapshot: person.firstNameSnapshot,
      middleNameSnapshot: person.middleNameSnapshot ?? null,
      lastNameSnapshot: person.lastNameSnapshot,
      secondLastNameSnapshot: person.secondLastNameSnapshot ?? null,
      phoneNumber: person.phoneNumber ?? null,
      legalIdSnapshot: person.legalIdSnapshot,
      externalWorkerId: person.externalWorkerId ?? null,
      updatedAt: new Date(),
    });

    const updateLocal = (tx: typeof db) => {
      const current = tx
        .select({ id: plannedAccesses.id, status: plannedAccesses.status })
        .from(plannedAccesses)
        .where(and(
          eq(plannedAccesses.id, data.id),
          eq(plannedAccesses.status, "PENDING_APPROVAL"),
          eq(plannedAccesses.updatedAt, data.expectedUpdatedAt),
        ))
        .get();

      if (!current) return { kind: "conflict" as const };

      const existingPersons = tx
        .select({ id: plannedAccessPersons.id })
        .from(plannedAccessPersons)
        .where(eq(plannedAccessPersons.plannedAccessId, data.id))
        .all();

      for (const person of existingPersons) {
        if (submittedIds.has(person.id)) continue;
        const linkedAccess = tx
          .select({ count: count() })
          .from(accessLogs)
          .where(eq(accessLogs.plannedAccessPersonId, person.id))
          .get();
        if ((linkedAccess?.count ?? 0) > 0) {
          return { kind: "linked-person" as const, personId: person.id };
        }
      }

      tx.update(plannedAccesses)
        .set(updateValues)
        .where(and(
          eq(plannedAccesses.id, data.id),
          eq(plannedAccesses.status, "PENDING_APPROVAL"),
          eq(plannedAccesses.updatedAt, data.expectedUpdatedAt),
        ))
        .run();

      for (const person of data.persons) {
        const values = getPersonValues(person);

        if (person.id) {
          tx.update(plannedAccessPersons)
            .set(values)
            .where(and(
              eq(plannedAccessPersons.id, person.id),
              eq(plannedAccessPersons.plannedAccessId, data.id),
            ))
            .run();
        } else {
          tx.insert(plannedAccessPersons).values({
            ...values,
            plannedAccessId: data.id,
          }).run();
        }
      }

      if (existingPersons.length > 0) {
        const removedIds = existingPersons
          .map((person) => person.id)
          .filter((id) => !submittedIds.has(id));
        if (removedIds.length > 0) {
          tx.delete(plannedAccessPersons)
            .where(and(
              eq(plannedAccessPersons.plannedAccessId, data.id),
              inArray(plannedAccessPersons.id, removedIds),
            ))
            .run();
        }
      }

      return { kind: "updated" as const, id: data.id };
    };

    if (isLocalDb()) {
      return db.transaction((tx) => updateLocal(tx as unknown as typeof db));
    }

    const d1 = db as unknown as DrizzleD1Database<typeof import("../../../db/schema")>;
    return d1.transaction(async (tx) => {
      const current = await tx
        .select({ id: plannedAccesses.id, status: plannedAccesses.status })
        .from(plannedAccesses)
        .where(and(
          eq(plannedAccesses.id, data.id),
          eq(plannedAccesses.status, "PENDING_APPROVAL"),
          eq(plannedAccesses.updatedAt, data.expectedUpdatedAt),
        ))
        .get();

      if (!current) return { kind: "conflict" as const };

      const existingPersons = await tx
        .select({ id: plannedAccessPersons.id })
        .from(plannedAccessPersons)
        .where(eq(plannedAccessPersons.plannedAccessId, data.id))
        .all();

      for (const person of existingPersons) {
        if (submittedIds.has(person.id)) continue;
        const linkedAccess = await tx
          .select({ count: count() })
          .from(accessLogs)
          .where(eq(accessLogs.plannedAccessPersonId, person.id))
          .get();
        if ((linkedAccess?.count ?? 0) > 0) {
          return { kind: "linked-person" as const, personId: person.id };
        }
      }

      await tx.update(plannedAccesses)
        .set(updateValues)
        .where(and(
          eq(plannedAccesses.id, data.id),
          eq(plannedAccesses.status, "PENDING_APPROVAL"),
          eq(plannedAccesses.updatedAt, data.expectedUpdatedAt),
        ))
        .run();

      for (const person of data.persons) {
        const values = getPersonValues(person);

        if (person.id) {
          await tx.update(plannedAccessPersons)
            .set(values)
            .where(and(
              eq(plannedAccessPersons.id, person.id),
              eq(plannedAccessPersons.plannedAccessId, data.id),
            ))
            .run();
        } else {
          await tx.insert(plannedAccessPersons).values({
            ...values,
            plannedAccessId: data.id,
          }).run();
        }
      }

      const removedIds = existingPersons
        .map((person) => person.id)
        .filter((id) => !submittedIds.has(id));
      if (removedIds.length > 0) {
        await tx.delete(plannedAccessPersons)
          .where(and(
            eq(plannedAccessPersons.plannedAccessId, data.id),
            inArray(plannedAccessPersons.id, removedIds),
          ))
          .run();
      }

      return { kind: "updated" as const, id: data.id };
    });
  }

  public static async linkPersonWorker(
    plannedAccessId: string,
    personId: string,
    externalWorkerId: string,
    workCategoryId: string,
  ) {
    const [person] = await db
      .update(plannedAccessPersons)
      .set({ externalWorkerId, workCategoryId, updatedAt: new Date() })
      .where(and(
        eq(plannedAccessPersons.id, personId),
        eq(plannedAccessPersons.plannedAccessId, plannedAccessId),
      ))
      .returning();
    return person;
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
      decisionReason: data.decisionReason,
      decisionById: data.decisionById,
      decisionAt: data.decisionAt ?? new Date(),
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
