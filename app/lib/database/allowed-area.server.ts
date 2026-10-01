import { eq } from "drizzle-orm";
import { db } from "../../../db/server";
import { allowedAreas } from "../../../db/schema";

export class AllowedAreaEntity {
  public static async create(data: { name: string; slug: string }) {
    const [area] = await db.insert(allowedAreas).values(data).returning();
    return area;
  }

  public static async findById(id: string) {
    const area = await db
      .select()
      .from(allowedAreas)
      .where(eq(allowedAreas.id, id))
      .then((rows) => rows[0]);
    return area ?? null;
  }

  public static async findMany() {
    return db
      .select()
      .from(allowedAreas)
      .orderBy(allowedAreas.name);
  }

  public static async update(id: string, data: { name?: string; slug?: string }) {
    const [area] = await db
      .update(allowedAreas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(allowedAreas.id, id))
      .returning();
    return area;
  }

  public static async delete(id: string) {
    const [area] = await db
      .delete(allowedAreas)
      .where(eq(allowedAreas.id, id))
      .returning();
    return area;
  }
}
