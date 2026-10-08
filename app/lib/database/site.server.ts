import { and, eq, ne } from "drizzle-orm";
import { db } from "../../../db/server";
import { sites } from "../../../db/schema";

export class SiteEntity {
  public static async create(data: { name: string; slug: string; address?: string; riskInformation?: string }) {
    const [site] = await db.insert(sites).values(data).returning();
    return site;
  }

  public static async findById(id: string): Promise<typeof sites.$inferSelect | null> {
    const site = await db
      .select()
      .from(sites)
      .where(eq(sites.id, id))
      .then((rows) => rows[0]);
    return site ?? null;
  }

  public static async findBySlug(slug: string, excludeId?: string) {
    const conditions = [eq(sites.slug, slug)];
    if (excludeId) conditions.push(ne(sites.id, excludeId));
    const site = await db
      .select()
      .from(sites)
      .where(and(...conditions))
      .then((rows) => rows[0]);
    return site ?? null;
  }

  public static async findMany() {
    return db.select().from(sites);
  }

  public static async update(
    id: string,
    data: { name?: string; slug?: string; address?: string; riskInformation?: string; riskInformationVersion?: number },
  ) {
    const [site] = await db
      .update(sites)
      .set(data)
      .where(eq(sites.id, id))
      .returning();
    return site;
  }

  public static async delete(id: string) {
    const [site] = await db
      .delete(sites)
      .where(eq(sites.id, id))
      .returning();
    return site;
  }
}
