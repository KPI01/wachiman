import { eq } from "drizzle-orm";
import { db } from "../../../db/server";
import { sites } from "../../../db/schema";

export class SiteEntity {
  public static async create(data: { name: string; slug: string; address?: string }) {
    const [site] = await db.insert(sites).values(data).returning();
    return site;
  }

  public static async findById(id: string) {
    const site = await db
      .select()
      .from(sites)
      .where(eq(sites.id, id))
      .get();
    return site ?? null;
  }

  public static async findBySlug(slug: string) {
    const site = await db
      .select()
      .from(sites)
      .where(eq(sites.slug, slug))
      .get();
    return site ?? null;
  }

  public static async findMany() {
    return db.select().from(sites).all();
  }

  public static async update(
    id: string,
    data: { name?: string; slug?: string; address?: string },
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
