import { and, desc, eq, inArray, lte } from "drizzle-orm";
import { db } from "../../../db/server";
import { workerDocuments } from "../../../db/schema";
import type { DocumentStatus } from "../../../db/enums";
import { startOfUtcDay } from "../document-expiry";

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
      .orderBy(desc(workerDocuments.createdAt))
      .all();
  }

  public static async findById(id: string) {
    return (await db
      .select()
      .from(workerDocuments)
      .where(eq(workerDocuments.id, id))
      .get()) ?? null;
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
      .get()) ?? null;
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
           lte(workerDocuments.expiryDate, yesterdayEnd),
        ),
      )
      .all();
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
