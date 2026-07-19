import { and, eq, ne } from "drizzle-orm";
import { db } from "../../../db/server";
import { companies } from "../../../db/schema";

export class CompanyEntity {
  public static async create(data: {
    name: string;
    slug: string;
    cif?: string;
    address?: string;
    phone?: string;
    email?: string;
  }) {
    const [company] = await db.insert(companies).values(data).returning();
    return company;
  }

  public static async findById(id: string) {
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .get();
    return company ?? null;
  }

  public static async findBySlug(slug: string, excludeId?: string) {
    const conditions = [eq(companies.slug, slug)];
    if (excludeId) conditions.push(ne(companies.id, excludeId));
    const company = await db
      .select()
      .from(companies)
      .where(and(...conditions))
      .get();
    return company ?? null;
  }

  public static async findMany() {
    return db.select().from(companies).all();
  }

  public static async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      cif?: string;
      address?: string;
      phone?: string;
      email?: string;
    },
  ) {
    const [company] = await db
      .update(companies)
      .set(data)
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  public static async delete(id: string) {
    const [company] = await db
      .delete(companies)
      .where(eq(companies.id, id))
      .returning();
    return company;
  }
}
