import { and, eq, ne } from "drizzle-orm";
import { hashText } from "../hash.server";
import { db } from "../../../db/server";
import { users } from "../../../db/schema";
import type { UserRole } from "../../../db/enums";

type UserWithRelations = typeof users.$inferSelect & {
  site?: { id: string; name: string };
  department?: { id: string; name: string };
};

type CreateUserInput = {
  fullName: string;
  username: string;
  role?: UserRole;
  password: string;
  siteId: string;
  departmentId: string;
};

type UpdateUserInput = {
  fullName?: string;
  username?: string;
  role?: UserRole;
  isActive?: boolean;
  siteId?: string;
  departmentId?: string;
};

export class UserEntity {
  public static async create(data: CreateUserInput) {
    const hashedPassword = await hashText(data.password);
    const [user] = await db
      .insert(users)
      .values({
        fullName: data.fullName,
        username: data.username,
        role: data.role ?? "ACCESS_OPERATOR",
        password: hashedPassword,
        siteId: data.siteId,
        departmentId: data.departmentId,
      })
      .returning();
    return user;
  }

  public static async getByUsername(
    username: string,
    relations: { site: true; department: true },
  ): Promise<UserWithRelations | null>;
  public static async getByUsername(
    username: string,
    relations?: { site?: false; department?: false },
  ): Promise<typeof users.$inferSelect | null>;
  public static async getByUsername(
    username: string,
    relations: { site?: boolean; department?: boolean } = {},
  ) {
    const query = db.select().from(users).where(
      and(eq(users.isActive, true), eq(users.isTrashed, false), eq(users.username, username)),
    );

    if (relations.site || relations.department) {
      const rows = await db.query.users.findFirst({
        where: and(eq(users.isActive, true), eq(users.isTrashed, false), eq(users.username, username)),
        with: {
          ...(relations.site ? { site: { columns: { id: true, name: true } } } : {}),
          ...(relations.department ? { department: { columns: { id: true, name: true } } } : {}),
        },
      });
      return rows ?? null;
    }

    return (await query.get()) ?? null;
  }

  public static async getById(id: string) {
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.isActive, true), eq(users.isTrashed, false), eq(users.id, id)))
      .get();
    return user ?? null;
  }

  public static async getAll({
    isActive = true,
    isTrashed = false,
    exclude = {},
  }: Partial<{
    isActive: boolean;
    isTrashed: boolean;
    exclude: Record<string, unknown>;
  }> = {}) {
    const conditions = [
      eq(users.isActive, isActive),
      eq(users.isTrashed, isTrashed),
    ];
    // exclude is simplified — the original used Prisma's NOT syntax
    if (Object.keys(exclude).length > 0) {
      for (const [key, value] of Object.entries(exclude)) {
        if (key === "id") {
          conditions.push(ne(users.id, value as string));
        }
      }
    }

    return db.select().from(users).where(and(...conditions)).all();
  }

  public static async update(id: string, data: UpdateUserInput) {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  public static async trash(id: string) {
    const [trashedUser] = await db
      .update(users)
      .set({ isActive: false, isTrashed: true })
      .where(eq(users.id, id))
      .returning();
    return trashedUser;
  }

  public static async updatePassword(id: string, newPassword: string) {
    const hashedPassword = await hashText(newPassword);
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}
