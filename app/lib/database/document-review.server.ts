import { desc, eq } from "drizzle-orm";
import { db } from "../../../db/server";
import { documentReviews } from "../../../db/schema";

export class DocumentReviewEntity {
  public static async create(data: typeof documentReviews.$inferInsert) {
    const [review] = await db.insert(documentReviews).values(data).returning();
    return review;
  }

  public static async findByDocumentId(documentId: string) {
    return db
      .select()
      .from(documentReviews)
      .where(eq(documentReviews.documentId, documentId))
      .orderBy(desc(documentReviews.reviewedAt));
  }
}
