import { and, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, lte, ne, or, sql } from "drizzle-orm";
import { db } from "../../../db/server";
import { calculateAccessDurationMs } from "../access-duration";
import {
  accessLogs,
  allowedAreas,
  auditLogs,
  companies,
  externalWorkers,
  plannedAccessPersonDecisions,
  plannedAccessPersons,
  plannedAccesses,
  sites,
  users,
} from "../../../db/schema";
import type { PlannedAccessStatus } from "../../../db/enums";

export type PlannedAccessListItem = typeof plannedAccesses.$inferSelect & {
  site?: { id: string; name: string; address: string | null; riskInformation: string | null } | null;
  company?: { id: string; name: string; cif: string; address: string | null } | null;
  requestedBy?: { id: string; fullName: string; username: string } | null;
  approvedBy?: { id: string; fullName: string; username: string } | null;
  plannedAccessPersons: Array<typeof plannedAccessPersons.$inferSelect & {
    accessLogs: Array<{
      id: string;
      entryTimestamp: Date;
      exitTimestamp: Date | null;
    }>;
    presenceDurationMs: number;
    workCategory?: {
      id: string;
      name: string;
      requiresTraining: boolean | null;
      requiresSpecialPermission: boolean | null;
      requiresWorkPermit: boolean | null;
      riskInformation?: string | null;
    } | null;
    allowedArea?: { id: string; name: string } | null;
    decision?: {
      accessDecision: "PENDING" | "APPROVED" | "DENIED";
      workDecision: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "DENIED";
      decisionReason: string | null;
    } | null;
  }>;
};

export type GetPlannedAccessInput = {
  status?: PlannedAccessStatus | PlannedAccessStatus[];
  siteId?: string;
  requestedById?: string;
  departmentId?: string;
  expectedDate?: Date;
  expectedFrom?: Date;
  expectedTo?: Date;
  query?: string;
  requestedByQuery?: string;
  visitorQuery?: string;
  companyQuery?: string;
};

export type CreatePlannedAccessInput = {
  expectedStartDatetime: Date;
  expectedEndDatetime?: Date;
  companySnapshot: string;
  companyId: string | null;
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
    allowedAreaSnapshot: string;
    allowedAreaId?: string;
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
  personAllowedAreas?: Array<{ personId: string; allowedAreaId: string | null; allowedAreaSnapshot?: string }>;
};

export type UpdatePendingPlannedAccessInput = {
  id: string;
  expectedUpdatedAt: Date;
  expectedStartDatetime: Date;
  expectedEndDatetime: Date | null;
  companySnapshot: string;
  companyId: string | null;
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
    workCategoryId?: string;
    allowedAreaSnapshot: string;
    allowedAreaId?: string;
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

function matchesUpdatedAt(expectedUpdatedAt: Date) {
  // PostgreSQL conserva microsegundos; Date y el formulario solo conservan milisegundos.
  return sql`date_trunc('milliseconds', ${plannedAccesses.updatedAt}) = ${expectedUpdatedAt.toISOString()}::timestamp`;
}

export class PlannedAccessEntity {
  public static async decidePerson(data: {
    id: string; personId: string; expectedUpdatedAt: Date;
    decision: "APPROVED" | "DENIED"; reason?: string; authorId: string;
    workerId?: string; categoryId?: string;
  }) {
    if (data.decision === "DENIED" && !data.reason?.trim()) return null;
    return db.transaction(async (tx) => {
      const [request] = await tx.select().from(plannedAccesses).where(and(
        eq(plannedAccesses.id, data.id), matchesUpdatedAt(data.expectedUpdatedAt),
        or(eq(plannedAccesses.status, "PENDING_APPROVAL"), isNull(plannedAccesses.status)),
      )).for("update");
      if (!request) return null;
      const [person] = await tx.select().from(plannedAccessPersons).where(and(
        eq(plannedAccessPersons.id, data.personId), eq(plannedAccessPersons.plannedAccessId, data.id),
      ));
      if (!person) return null;
      const [previous] = await tx.select().from(plannedAccessPersonDecisions)
        .where(eq(plannedAccessPersonDecisions.plannedAccessPersonId, person.id));
      if (previous && previous.accessDecision !== "PENDING") return null;
      const now = new Date();
      if (data.decision === "APPROVED") {
        if (!request.companyId || !data.categoryId) return null;
        let workerId = data.workerId;
        if (!workerId) {
          const legalId = person.legalIdSnapshot.trim().toUpperCase();
          const [created] = await tx.insert(externalWorkers).values({
            firstName: person.firstNameSnapshot, middleName: person.middleNameSnapshot,
            lastName: person.lastNameSnapshot, secondLastName: person.secondLastNameSnapshot,
            phoneNumber: person.phoneNumber, legalId,
            companyId: request.companyId, workCategoryId: data.categoryId,
          }).onConflictDoNothing({ target: externalWorkers.legalId }).returning();
          const [existing] = created ? [created] : await tx.select().from(externalWorkers)
            .where(sql`upper(${externalWorkers.legalId}) = ${legalId}`);
          workerId = existing.id;
        }
        let areaId = person.allowedAreaId;
        if (!areaId) {
          const name = person.allowedAreaSnapshot.trim();
          const [existing] = await tx.select().from(allowedAreas)
            .where(sql`lower(trim(${allowedAreas.name})) = lower(${name})`).limit(1);
          const [area] = existing ? [existing] : await tx.insert(allowedAreas)
            .values({ name, slug: `AREA-${crypto.randomUUID()}` })
            .onConflictDoUpdate({ target: allowedAreas.name, set: { name } }).returning();
          areaId = area.id;
        }
        await tx.update(plannedAccessPersons).set({ externalWorkerId: workerId,
          workCategoryId: data.categoryId, allowedAreaId: areaId, updatedAt: now,
        }).where(eq(plannedAccessPersons.id, person.id));
      }
      const decision = {
        plannedAccessPersonId: person.id,
        accessDecision: data.decision,
        workDecision: "NOT_REQUIRED" as const,
        decisionReason: data.decision === "DENIED" ? data.reason ?? null : null,
        decidedById: data.authorId, decidedAt: now, updatedAt: now,
      };
      await tx.insert(plannedAccessPersonDecisions).values(decision)
        .onConflictDoUpdate({ target: plannedAccessPersonDecisions.plannedAccessPersonId, set: decision });
      const decisions = await tx.select({ accessDecision: plannedAccessPersonDecisions.accessDecision,
        reason: plannedAccessPersonDecisions.decisionReason,
      }).from(plannedAccessPersons).leftJoin(plannedAccessPersonDecisions,
        eq(plannedAccessPersonDecisions.plannedAccessPersonId, plannedAccessPersons.id))
        .where(eq(plannedAccessPersons.plannedAccessId, data.id));
      const complete = decisions.every((item) => item.accessDecision && item.accessDecision !== "PENDING");
      const hasApproved = decisions.some((item) => item.accessDecision === "APPROVED");
      const status = complete ? (hasApproved ? "APPROVED" : "REJECTED") : "PENDING_APPROVAL";
      await tx.update(plannedAccesses).set({
        status, updatedAt: now,
        ...(complete ? { decisionById: data.authorId, decisionAt: now,
          decisionReason: hasApproved ? null : decisions.map((item) => item.reason).filter(Boolean).join("; "),
          approvedById: hasApproved ? data.authorId : null, approvedAt: hasApproved ? now : null,
        } : {}),
      }).where(eq(plannedAccesses.id, data.id));
      await tx.insert(auditLogs).values({ entityType: "PlannedAccess", entityId: data.id,
        action: data.decision === "APPROVED" ? "PLANNED_ACCESS_PERSON_APPROVED" : "PLANNED_ACCESS_PERSON_REJECTED",
        changedBy: data.authorId, summary: data.decision === "APPROVED" ? "Visitante aprobado" : "Visitante rechazado",
        metadata: { personId: person.id, accessDecision: data.decision, reason: decision.decisionReason, status },
      });
      return { status };
    });
  }

  public static async validateCompany(data: {
    id: string;
    expectedUpdatedAt: Date;
    companyId?: string;
    newCompany?: Parameters<typeof import("./company.server").CompanyEntity.create>[0];
  }) {
    return db.transaction(async (tx) => {
      const [pending] = await tx.select().from(plannedAccesses).where(and(
        eq(plannedAccesses.id, data.id),
        matchesUpdatedAt(data.expectedUpdatedAt),
        or(eq(plannedAccesses.status, "PENDING_APPROVAL"), isNull(plannedAccesses.status)),
        isNull(plannedAccesses.companyId),
      )).for("update");
      if (!pending) return null;
      const [company] = data.newCompany
        ? await tx.insert(companies).values(data.newCompany).returning()
        : await tx.select().from(companies).where(eq(companies.id, data.companyId!));
      if (!company) return null;
      const [updated] = await tx.update(plannedAccesses).set({
        companyId: company.id,
        companySnapshot: company.name,
        updatedAt: new Date(),
      }).where(eq(plannedAccesses.id, pending.id)).returning();
      return updated;
    });
  }

  public static async create(data: CreatePlannedAccessInput) {
    const [pa] = await db
      .insert(plannedAccesses)
      .values({
        expectedStartDatetime: data.expectedStartDatetime,
        expectedEndDatetime: data.expectedEndDatetime ?? null,
        companySnapshot: data.companySnapshot,
        companyId: data.companyId,
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
          allowedAreaSnapshot: p.allowedAreaSnapshot,
          allowedAreaId: p.allowedAreaId,
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
    if (input?.expectedFrom) conditions.push(gte(plannedAccesses.expectedStartDatetime, input.expectedFrom));
    if (input?.expectedTo) conditions.push(lte(plannedAccesses.expectedStartDatetime, input.expectedTo));
    if (input?.requestedByQuery?.trim()) {
      const query = `%${input.requestedByQuery.trim()}%`;
      const matchingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(or(ilike(users.fullName, query), ilike(users.username, query)));
      if (!matchingUsers.length) return [];
      conditions.push(inArray(plannedAccesses.requestedById, matchingUsers.map((user) => user.id)));
    }
    if (input?.visitorQuery?.trim()) {
      const query = `%${input.visitorQuery.trim()}%`;
      const matchingPeople = await db
        .select({ plannedAccessId: plannedAccessPersons.plannedAccessId })
        .from(plannedAccessPersons)
        .where(or(
          ilike(plannedAccessPersons.firstNameSnapshot, query),
          ilike(plannedAccessPersons.middleNameSnapshot, query),
          ilike(plannedAccessPersons.lastNameSnapshot, query),
          ilike(plannedAccessPersons.secondLastNameSnapshot, query),
          ilike(plannedAccessPersons.legalIdSnapshot, query),
          ilike(plannedAccessPersons.phoneNumber, query),
        ));
      const matchingPlannedAccessIds = [...new Set(matchingPeople.map((person) => person.plannedAccessId))];
      if (!matchingPlannedAccessIds.length) return [];
      conditions.push(inArray(plannedAccesses.id, matchingPlannedAccessIds));
    }
    if (input?.companyQuery?.trim()) {
      const query = `%${input.companyQuery.trim()}%`;
      const matchingCompanies = await db
        .select({ id: companies.id })
        .from(companies)
        .where(or(ilike(companies.name, query), ilike(companies.cif, query)));
      const companyConditions = [ilike(plannedAccesses.companySnapshot, query)];
      if (matchingCompanies.length) {
        companyConditions.push(inArray(plannedAccesses.companyId, matchingCompanies.map((company) => company.id)));
      }
      conditions.push(or(...companyConditions)!);
    }
    if (input?.query?.trim()) {
      const query = `%${input.query.trim()}%`;
      const matchingPeople = await db
        .select({ plannedAccessId: plannedAccessPersons.plannedAccessId })
        .from(plannedAccessPersons)
        .where(or(
          ilike(plannedAccessPersons.firstNameSnapshot, query),
          ilike(plannedAccessPersons.lastNameSnapshot, query),
          ilike(plannedAccessPersons.legalIdSnapshot, query),
        ));
      const matchingIds = [...new Set(matchingPeople.map((person) => person.plannedAccessId))];
      const [matchingSites, matchingUsers] = await Promise.all([
        db.select({ id: sites.id }).from(sites).where(ilike(sites.name, query)),
        db.select({ id: users.id }).from(users).where(or(ilike(users.fullName, query), ilike(users.username, query))),
      ]);
      const queryConditions = [
        ilike(plannedAccesses.companySnapshot, query),
        ilike(plannedAccesses.visitReason, query),
      ];
      if (matchingIds.length) queryConditions.push(inArray(plannedAccesses.id, matchingIds));
      if (matchingSites.length) queryConditions.push(inArray(plannedAccesses.siteId, matchingSites.map((site) => site.id)));
      if (matchingUsers.length) queryConditions.push(inArray(plannedAccesses.requestedById, matchingUsers.map((user) => user.id)));
      conditions.push(or(...queryConditions)!);
    }

    const rows = await db.query.plannedAccesses.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
         site: { columns: { id: true, name: true, address: true, riskInformation: true } },
         company: { columns: { id: true, name: true, cif: true, address: true } },
        requestedBy: { columns: { id: true, fullName: true, username: true } },
        approvedBy: { columns: { id: true, fullName: true, username: true } },
        plannedAccessPersons: {
          with: {
            accessLogs: {
              columns: { id: true, entryTimestamp: true, exitTimestamp: true },
            },
            workCategory: {
              columns: {
                id: true,
                name: true,
                requiresTraining: true,
                requiresSpecialPermission: true,
                requiresWorkPermit: true,
                riskInformation: true,
              },
            },
             allowedArea: { columns: { id: true, name: true } },
             decision: true,
          },
        },
      },
      orderBy: (pa, { desc: d }) => [d(pa.createdAt)],
    });

    return rows.map((row) => ({
      ...row,
      plannedAccessPersons: row.plannedAccessPersons.map((person) => ({
        ...person,
        presenceDurationMs: calculateAccessDurationMs(person.accessLogs),
      })),
    }));
  }

  public static async findById(id: string) {
    const row = await db.query.plannedAccesses.findFirst({
      where: eq(plannedAccesses.id, id),
      with: {
         site: { columns: { id: true, name: true, address: true, riskInformation: true } },
         company: { columns: { id: true, name: true, cif: true, address: true } },
        requestedBy: { columns: { id: true, fullName: true, username: true } },
        approvedBy: { columns: { id: true, fullName: true, username: true } },
        plannedAccessPersons: {
          with: {
            accessLogs: {
              columns: { id: true, entryTimestamp: true, exitTimestamp: true },
            },
            workCategory: {
              columns: {
                id: true,
                name: true,
                requiresTraining: true,
                requiresSpecialPermission: true,
                requiresWorkPermit: true,
                riskInformation: true,
              },
            },
             allowedArea: { columns: { id: true, name: true } },
             decision: true,
          },
        },
      },
    });
    if (!row) return null;

    return {
      ...row,
      plannedAccessPersons: row.plannedAccessPersons.map((person) => ({
        ...person,
        presenceDurationMs: calculateAccessDurationMs(person.accessLogs),
      })),
    };
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
      const conditions = [
        status === "PENDING_APPROVAL"
          ? or(eq(plannedAccesses.status, status), isNull(plannedAccesses.status))!
          : eq(plannedAccesses.status, status),
      ];
      if (input.siteId) conditions.push(eq(plannedAccesses.siteId, input.siteId));
      if (input.requestedById) conditions.push(eq(plannedAccesses.requestedById, input.requestedById));
      if (input.departmentId) conditions.push(eq(plannedAccesses.departmentId, input.departmentId));

      const result = await db
        .select({ count: count() })
        .from(plannedAccesses)
        .where(and(...conditions))
        .then((rows) => rows[0]);
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
      companyId: data.companyId,
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
      workCategoryId: person.workCategoryId ?? null,
      allowedAreaSnapshot: person.allowedAreaSnapshot,
      allowedAreaId: person.allowedAreaId ?? null,
      externalWorkerId: person.externalWorkerId ?? null,
      updatedAt: new Date(),
    });

    return db.transaction(async (tx) => {
      const [current] = await tx
        .select({ id: plannedAccesses.id, status: plannedAccesses.status })
        .from(plannedAccesses)
        .where(and(
          eq(plannedAccesses.id, data.id),
          eq(plannedAccesses.status, "PENDING_APPROVAL"),
          matchesUpdatedAt(data.expectedUpdatedAt),
        ))
        .limit(1);

      if (!current) return { kind: "conflict" as const };

      const existingPersons = await tx
        .select({ id: plannedAccessPersons.id })
        .from(plannedAccessPersons)
        .where(eq(plannedAccessPersons.plannedAccessId, data.id));

      for (const person of existingPersons) {
        if (submittedIds.has(person.id)) continue;
        const [linkedAccess] = await tx
          .select({ count: count() })
          .from(accessLogs)
          .where(eq(accessLogs.plannedAccessPersonId, person.id))
          .limit(1);
        if ((linkedAccess?.count ?? 0) > 0) {
          return { kind: "linked-person" as const, personId: person.id };
        }
      }

      const [updated] = await tx
        .update(plannedAccesses)
        .set(updateValues)
        .where(and(
          eq(plannedAccesses.id, data.id),
          eq(plannedAccesses.status, "PENDING_APPROVAL"),
          matchesUpdatedAt(data.expectedUpdatedAt),
        ))
        .returning({ id: plannedAccesses.id });
      if (!updated) return { kind: "conflict" as const };

      for (const person of data.persons) {
        const values = getPersonValues(person);
        if (person.id) {
          await tx.update(plannedAccessPersons)
            .set(values)
            .where(and(
              eq(plannedAccessPersons.id, person.id),
              eq(plannedAccessPersons.plannedAccessId, data.id),
            ));
        } else {
          await tx.insert(plannedAccessPersons).values({
            ...values,
            plannedAccessId: data.id,
          });
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
          ));
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
    data: UpdatePlannedAccessStatusInput & {
      expectedUpdatedAt: Date;
      personWorkCategories: Array<{ personId: string; workCategoryId: string | null; externalWorkerId: string }>;
      personAllowedAreas: Array<{ personId: string; allowedAreaId: string; allowedAreaSnapshot?: string }>;
    },
  ) {
    const personIds = [...new Set(data.personWorkCategories.map((person) => person.personId))];
    const areaPersonIds = [...new Set(data.personAllowedAreas.map((person) => person.personId))];
    if (
      personIds.length !== data.personWorkCategories.length ||
      areaPersonIds.length !== data.personAllowedAreas.length ||
      personIds.length !== areaPersonIds.length ||
      !personIds.every((personId) => areaPersonIds.includes(personId))
    ) return undefined;

    if (personIds.length > 0) {
      const linkedPersons = await db
        .select({ id: plannedAccessPersons.id })
        .from(plannedAccessPersons)
        .where(and(
          eq(plannedAccessPersons.plannedAccessId, data.id),
          inArray(plannedAccessPersons.id, personIds),
        ));
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

    return db.transaction(async (tx) => {
      const [pa] = await tx
        .update(plannedAccesses)
        .set(approvalValues)
        .where(and(
          eq(plannedAccesses.id, data.id),
          or(eq(plannedAccesses.status, "PENDING_APPROVAL"), isNull(plannedAccesses.status)),
          isNotNull(plannedAccesses.companyId),
          matchesUpdatedAt(data.expectedUpdatedAt),
        ))
        .returning();
      if (!pa) return undefined;

      const areasByPerson = new Map(data.personAllowedAreas.map((person) => [person.personId, person]));
      for (const person of data.personWorkCategories) {
        const area = areasByPerson.get(person.personId);
        await tx
          .update(plannedAccessPersons)
          .set({
            workCategoryId: person.workCategoryId,
            allowedAreaId: area?.allowedAreaId,
            ...(area?.allowedAreaSnapshot ? { allowedAreaSnapshot: area.allowedAreaSnapshot } : {}),
            externalWorkerId: person.externalWorkerId,
            updatedAt: new Date(),
          })
          .where(and(
            eq(plannedAccessPersons.id, person.personId),
            eq(plannedAccessPersons.plannedAccessId, data.id),
          ));
      }

      return pa;
    });
  }

  public static async countPersonsWithAccessLogs(
    plannedAccessId: string,
  ): Promise<number> {
    const distinctPersons = await db
      .selectDistinct({ personId: accessLogs.plannedAccessPersonId })
      .from(accessLogs)
      .where(and(
        eq(accessLogs.plannedAccessId, plannedAccessId),
        isNotNull(accessLogs.plannedAccessPersonId),
      ));

    return distinctPersons.length;
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
      .where(and(...conditions, overlapCondition!));

    // Enfoque B: load persons separately
    const personIds = rows.map((r) => r.id);
    const persons =
      personIds.length > 0
        ? await db
            .select()
            .from(plannedAccessPersons)
            .where(inArray(plannedAccessPersons.plannedAccessId, personIds))
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
      .where(eq(plannedAccessPersons.legalIdSnapshot, legalId));

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
      .where(and(...conditions, overlapCondition!));

    const personIds = rows.map((r) => r.id);
    const persons =
      personIds.length > 0
        ? await db
            .select()
            .from(plannedAccessPersons)
            .where(inArray(plannedAccessPersons.plannedAccessId, personIds))
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

}
