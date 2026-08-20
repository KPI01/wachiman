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

  public static async resolveDefault() {
    const categories = await this.findMany();
    const generic = categories.find(
      (category) => category.name.trim().toUpperCase() === "GENERAL",
    );
    if (generic) return generic.id;

    const lenient = categories.find(
      (category) => !category.requiresTraining && !category.requiresSpecialPermission,
    );
    if (lenient) return lenient.id;

    const [first] = categories;
    if (first) return first.id;

    const created = await this.create({
      name: "General",
      description: "Tipo de trabajo por defecto",
    });
    return created.id;
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
