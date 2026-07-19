import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../../../db/server";
import { workerDocuments } from "../../../db/schema";
import type { DocumentStatus, DocumentType } from "../../../db/enums";

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
    return db
      .select()
      .from(workerDocuments)
      .where(
        and(
          eq(workerDocuments.status, "VALIDATED" as DocumentStatus),
          lte(workerDocuments.expiryDate, new Date().toISOString()),
        ),
      )
      .all();
  }

  public static async markManyAsExpired(ids: string[]) {
    const updated = await db
      .update(workerDocuments)
      .set({ status: "EXPIRED" as DocumentStatus })
      .where(and(...ids.map((id) => eq(workerDocuments.id, id))))
      .returning();
    return updated;
  }

  public static async findValidByWorkerIdAndType(
    workerId: string,
    documentType: DocumentType,
  ) {
    return db
      .select()
      .from(workerDocuments)
      .where(
        and(
          eq(workerDocuments.externalWorkerId, workerId),
          eq(workerDocuments.documentType, documentType),
          eq(workerDocuments.status, "VALIDATED" as DocumentStatus),
          gte(workerDocuments.expiryDate, new Date().toISOString()),
        ),
      )
      .all();
  }

  public static async findAllWithWorker() {
    return db
      .select()
      .from(workerDocuments)
      .orderBy(desc(workerDocuments.createdAt))
      .all();
  }
}
