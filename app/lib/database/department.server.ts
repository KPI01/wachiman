import { eq } from "drizzle-orm";
import { db } from "../../../db/server";
import { departments } from "../../../db/schema";

export class DepartmentEntity {
  public static async create(data: { name: string; slug: string }) {
    const [department] = await db.insert(departments).values(data).returning();
    return department;
  }

  public static async findById(id: string) {
    const department = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .get();
    return department ?? null;
  }

  public static async findBySlug(slug: string) {
    const department = await db
      .select()
      .from(departments)
      .where(eq(departments.slug, slug))
      .get();
    return department ?? null;
  }

  public static async findAll() {
    return db.select().from(departments).all();
  }

  public static async update(id: string, data: { name?: string; slug?: string }) {
    const [department] = await db
      .update(departments)
      .set(data)
      .where(eq(departments.id, id))
      .returning();
    return department;
  }

  public static async delete(id: string) {
    const [department] = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning();
    return department;
  }
}
