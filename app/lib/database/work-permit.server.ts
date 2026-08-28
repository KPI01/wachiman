import { and, desc, eq } from "drizzle-orm";
import { db } from "../../../db/server";
import {
  plannedAccessPersonDecisions,
  workPermitActivities,
  workPermitSignatures,
  workPermits,
} from "../../../db/schema";
import type { AccessDecision, WorkDecision } from "../../../db/enums";

export class WorkPermitEntity {
  public static async findByPersonId(plannedAccessPersonId: string) {
    return (await db.query.workPermits.findFirst({
      where: eq(workPermits.plannedAccessPersonId, plannedAccessPersonId),
      with: {
        activity: { with: { site: true } },
        workCategory: true,
        signatures: true,
      },
      orderBy: [desc(workPermits.createdAt)],
    })) ?? null;
  }

  public static async findApprovedForWorkerOnDate(
    externalWorkerId: string,
    siteId: string,
    date: Date,
    legalId?: string,
  ) {
    const permits = await this.findApprovedForSiteOnDate(siteId, date);
    const normalizedLegalId = legalId?.trim().toUpperCase();
    return permits.find((permit) =>
      permit.externalWorkerId === externalWorkerId ||
      (normalizedLegalId && permit.legalIdSnapshot.toUpperCase() === normalizedLegalId),
    ) ?? null;
  }

  public static async findApprovedForSiteOnDate(siteId: string, date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const permits = await db.query.workPermits.findMany({
      with: { activity: { with: { site: true } }, workCategory: true, signatures: true },
      orderBy: [desc(workPermits.createdAt)],
    });

    return permits.filter((permit) =>
      permit.status === "APPROVED" &&
      permit.activity.siteId === siteId &&
      permit.activity.expectedStartDatetime <= end &&
      (!permit.activity.expectedEndDatetime || permit.activity.expectedEndDatetime >= start),
    );
  }

  public static async findByPlannedAccessId(plannedAccessId: string) {
    return db.query.workPermitActivities.findMany({
      where: eq(workPermitActivities.plannedAccessId, plannedAccessId),
      with: {
        workPermits: {
          with: { signatures: true },
        },
      },
      orderBy: [desc(workPermitActivities.createdAt)],
    });
  }

  public static async findById(id: string) {
    return (await db.query.workPermits.findFirst({
      where: eq(workPermits.id, id),
      with: { activity: { with: { site: true } }, workCategory: true, signatures: true },
    })) ?? null;
  }

  public static async createActivity(
    data: typeof workPermitActivities.$inferInsert,
  ): Promise<typeof workPermitActivities.$inferSelect> {
    const [activity] = await db.insert(workPermitActivities).values(data).returning();
    return activity;
  }

  public static async createPermit(data: typeof workPermits.$inferInsert) {
    const [permit] = await db.insert(workPermits).values(data).returning();
    return permit;
  }

  public static async findDecision(plannedAccessPersonId: string) {
    return db
      .select()
      .from(plannedAccessPersonDecisions)
      .where(eq(plannedAccessPersonDecisions.plannedAccessPersonId, plannedAccessPersonId))
      .get() ?? null;
  }

  public static async saveDecision(data: {
    plannedAccessPersonId: string;
    workPermitId?: string | null;
    accessDecision: AccessDecision;
    workDecision: WorkDecision;
    decisionReason?: string | null;
    decidedById: string;
    decidedAt: Date;
  }) {
    const existing = await this.findDecision(data.plannedAccessPersonId);
    if (existing) {
      const [decision] = await db
        .update(plannedAccessPersonDecisions)
        .set({
          workPermitId: data.workPermitId ?? null,
          accessDecision: data.accessDecision,
          workDecision: data.workDecision,
          decisionReason: data.decisionReason ?? null,
          decidedById: data.decidedById,
          decidedAt: data.decidedAt,
          updatedAt: data.decidedAt,
        })
        .where(eq(plannedAccessPersonDecisions.id, existing.id))
        .returning();
      return decision;
    }

    const [decision] = await db
      .insert(plannedAccessPersonDecisions)
      .values({
        plannedAccessPersonId: data.plannedAccessPersonId,
        workPermitId: data.workPermitId ?? null,
        accessDecision: data.accessDecision,
        workDecision: data.workDecision,
        decisionReason: data.decisionReason ?? null,
        decidedById: data.decidedById,
        decidedAt: data.decidedAt,
      })
      .returning();
    return decision;
  }

  public static async approvePermit(id: string, approvedById: string, snapshot: Record<string, unknown>) {
    const [permit] = await db
      .update(workPermits)
      .set({
        status: "APPROVED",
        approvedById,
        approvedAt: new Date(),
        approvedSnapshot: snapshot,
        updatedAt: new Date(),
      })
      .where(eq(workPermits.id, id))
      .returning();
    return permit;
  }

  public static async createSignature(data: typeof workPermitSignatures.$inferInsert) {
    const [signature] = await db.insert(workPermitSignatures).values(data).returning();
    return signature;
  }

  public static async hasSignature(workPermitId: string, signerType: string) {
    return Boolean(
      await db
        .select({ id: workPermitSignatures.id })
        .from(workPermitSignatures)
        .where(
          and(
            eq(workPermitSignatures.workPermitId, workPermitId),
            eq(workPermitSignatures.signerType, signerType),
          ),
        )
        .get(),
    );
  }
}
