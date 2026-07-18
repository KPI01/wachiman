import { eq } from "drizzle-orm";
import { db } from "../../../db/server";
import { workCategories } from "../../../db/schema";

export class WorkCategoryEntity {
  public static async create(data: {
    name: string;
    description?: string;
    requiresSpecialPermission?: boolean;
    requiresTraining?: boolean;
  }) {
    const [wc] = await db.insert(workCategories).values(data).returning();
    return wc;
  }

  public static async findById(id: string) {
    const wc = await db
      .select()
      .from(workCategories)
      .where(eq(workCategories.id, id))
      .get();
    return wc ?? null;
  }

  public static async findMany() {
    return db.select().from(workCategories).all();
  }

  public static async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      requiresSpecialPermission?: boolean;
      requiresTraining?: boolean;
    },
  ) {
    const [wc] = await db
      .update(workCategories)
      .set(data)
      .where(eq(workCategories.id, id))
      .returning();
    return wc;
  }

  public static async delete(id: string) {
    const [wc] = await db
      .delete(workCategories)
      .where(eq(workCategories.id, id))
      .returning();
    return wc;
  }
}
