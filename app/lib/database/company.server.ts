import { and, eq, ilike, ne, or, sql } from "drizzle-orm";
import { normalizeCompanyName } from "../company-name";
import { db } from "../../../db/server";
import { companies } from "../../../db/schema";

export class CompanyEntity {
  public static async findNameMatches(name: string) {
    // La misma normalización que el cliente, sin límite de sugerencias ni búsqueda difusa.
    return db.select().from(companies).where(sql`
      lower(regexp_replace(trim(replace(regexp_replace(normalize(${companies.name}, NFD),
        '[\u0300-\u036f]', '', 'g'), '.', '')), '\\s+', ' ', 'g')) = ${normalizeCompanyName(name)}
    `).limit(2);
  }

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

  public static async findById(id: string): Promise<typeof companies.$inferSelect | null> {
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .then((rows) => rows[0]);
    return company ?? null;
  }

  public static async findBySlug(slug: string, excludeId?: string): Promise<typeof companies.$inferSelect | null> {
    const conditions = [eq(companies.slug, slug)];
    if (excludeId) conditions.push(ne(companies.id, excludeId));
    const company = await db
      .select()
      .from(companies)
      .where(and(...conditions))
      .then((rows) => rows[0]);
    return company ?? null;
  }

  public static async findOrCreateByName(name: string) {
    const normalizedName = name.trim().replace(/\s+/g, " ");
    const companies = await this.findMany();
    const existing = companies.find(
      (company) =>
        company.name.trim().replace(/\s+/g, " ").toUpperCase() ===
        normalizedName.toUpperCase(),
    );
    if (existing) return existing;

    const baseSlug =
      normalizedName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toUpperCase() || "EMPRESA";
    let slug = baseSlug;
    let suffix = 1;
    while (companies.some((company) => company.slug === slug)) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    return this.create({ name: normalizedName, slug });
  }

  public static async findMany() {
    return db.select().from(companies);
  }

  public static async searchByName(query: string) {
    return db
      .select({ id: companies.id, name: companies.name, cif: companies.cif, address: companies.address })
      .from(companies)
      .where(or(ilike(companies.name, `%${query}%`), ilike(companies.cif, `%${query}%`)))
      .limit(5);
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
