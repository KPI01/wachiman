import { and, desc, eq, inArray, lte } from "drizzle-orm";
import { db } from "../../../db/server";
import {
  auditLogs,
  companies,
  documentReviews,
  externalWorkers,
  workerDocuments,
} from "../../../db/schema";
import type { DocumentStatus } from "../../../db/enums";
import { startOfUtcDay } from "../document-expiry";

export type WorkerDocumentListItem = typeof workerDocuments.$inferSelect;
export type WorkerDocumentWithWorker = WorkerDocumentListItem & {
  externalWorker: typeof externalWorkers.$inferSelect & {
    company: Pick<typeof companies.$inferSelect, "id" | "name">;
  };
};

export class WorkerDocumentEntity {
  public static async create(data: (typeof workerDocuments.$inferInsert)) {
    const [doc] = await db.insert(workerDocuments).values(data).returning();
    return doc;
  }

  public static async findByWorkerId(workerId: string) {
    return db
      .select()
      .from(workerDocuments)
      .where(eq(workerDocuments.externalWorkerId, workerId))
      .orderBy(desc(workerDocuments.createdAt));
  }

  public static async findById(id: string) {
    return (await db
      .select()
      .from(workerDocuments)
      .where(eq(workerDocuments.id, id))
      .then((rows) => rows[0])) ?? null;
  }

  public static async findByIdAndWorkerId(id: string, workerId: string) {
    return (await db
      .select()
      .from(workerDocuments)
      .where(
        and(
          eq(workerDocuments.id, id),
          eq(workerDocuments.externalWorkerId, workerId),
        ),
      )
      .then((rows) => rows[0])) ?? null;
  }

  public static async update(id: string, data: Partial<typeof workerDocuments.$inferInsert>) {
    const [doc] = await db
      .update(workerDocuments)
      .set(data)
      .where(eq(workerDocuments.id, id))
      .returning();
    return doc;
  }

  public static async delete(id: string) {
    const [doc] = await db
      .delete(workerDocuments)
      .where(eq(workerDocuments.id, id))
      .returning();
    return doc;
  }

  public static async findExpiredValidated() {
    const yesterdayEnd = new Date(startOfUtcDay(new Date()).getTime() - 1);
    return db
      .select()
      .from(workerDocuments)
      .where(
        and(
          eq(workerDocuments.status, "VALIDATED" as DocumentStatus),
            lte(workerDocuments.validUntil, yesterdayEnd),
        ),
      );
  }

  public static async markManyAsExpired(ids: string[]) {
    if (ids.length === 0) return [];

    const updated = await db
      .update(workerDocuments)
      .set({ status: "EXPIRED" as DocumentStatus })
      .where(
        and(
          inArray(workerDocuments.id, ids),
          eq(workerDocuments.status, "VALIDATED" as DocumentStatus),
        ),
      )
      .returning();
    return updated;
  }

  public static async review(
    documentId: string,
    data: {
      decision: "VALIDATED" | "REJECTED";
      reason: string;
      reviewedById: string;
      reviewedAt: Date;
      evidenceSnapshot: Record<string, unknown>;
      summary: string;
    },
  ) {
    const documentUpdate = {
      status: data.decision,
      reviewedById: data.reviewedById,
      reviewedAt: data.reviewedAt,
      reviewReason: data.reason,
      updatedAt: data.reviewedAt,
    };
    const reviewValues = {
      documentId,
      decision: data.decision,
      reason: data.reason,
      evidenceSnapshot: data.evidenceSnapshot,
      reviewedById: data.reviewedById,
      reviewedAt: data.reviewedAt,
    };

    return db.transaction(async (tx) => {
      const [reviewedDocument] = await tx
        .update(workerDocuments)
        .set(documentUpdate)
        .where(and(
          eq(workerDocuments.id, documentId),
          eq(workerDocuments.status, "PENDING_REVIEW"),
        ))
        .returning();
      if (!reviewedDocument) return null;

      const [review] = await tx.insert(documentReviews).values(reviewValues).returning();
      await tx.insert(auditLogs).values({
        entityType: "WorkerDocument",
        entityId: documentId,
        action: "DOCUMENT_REVIEWED",
        changedBy: data.reviewedById,
        summary: data.summary,
        metadata: {
          reviewId: review.id,
          decision: data.decision,
          reason: data.reason,
          evidenceSnapshot: data.evidenceSnapshot,
        },
      });
      return review;
    });
  }

  public static async findAllWithWorker() {
    return db.query.workerDocuments.findMany({
      orderBy: (doc, { desc: d }) => [d(doc.createdAt)],
      with: {
        externalWorker: {
          with: {
            company: { columns: { id: true, name: true } },
          },
        },
      },
    });
  }
}
