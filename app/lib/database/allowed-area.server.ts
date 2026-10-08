import { and, eq, getTableColumns, ilike, ne } from "drizzle-orm";
import { db } from "../../../db/server";
import { allowedAreas, sites } from "../../../db/schema";

export class AllowedAreaEntity {
  public static async create(data: { name: string; slug: string; siteId: string }) {
    const [area] = await db.insert(allowedAreas).values(data).returning();
    return area;
  }

  public static async findById(id: string): Promise<typeof allowedAreas.$inferSelect | null> {
    const area = await db
      .select()
      .from(allowedAreas)
      .where(eq(allowedAreas.id, id))
      .then((rows) => rows[0]);
    return area ?? null;
  }

  public static async findBySlug(siteId: string, slug: string, excludeId?: string): Promise<typeof allowedAreas.$inferSelect | null> {
    const [area] = await db.select().from(allowedAreas).where(and(
      eq(allowedAreas.siteId, siteId), eq(allowedAreas.slug, slug),
      excludeId ? ne(allowedAreas.id, excludeId) : undefined,
    ));
    return area ?? null;
  }

  public static async findMany(siteId?: string) {
    return db
      .select({ ...getTableColumns(allowedAreas), siteName: sites.name })
      .from(allowedAreas)
      .innerJoin(sites, eq(allowedAreas.siteId, sites.id))
      .where(siteId ? eq(allowedAreas.siteId, siteId) : undefined)
      .orderBy(sites.name, allowedAreas.name);
  }

  public static async search(query: string, siteId: string) {
    return db.select({ id: allowedAreas.id, name: allowedAreas.name }).from(allowedAreas)
      .where(and(eq(allowedAreas.siteId, siteId), ilike(allowedAreas.name, `%${query}%`)))
      .orderBy(allowedAreas.name).limit(8);
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
