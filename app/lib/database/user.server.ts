import type { Prisma } from "../../../prisma/generated/prisma/client";
import { hashText } from "../hash.server";
import { prisma } from "../prisma.server";

type GetUserByUsernameWithRelations = Prisma.UserGetPayload<{
  include: {
    site: {
      select: {
        id: true;
        name: true;
      };
    };
    department: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

type CreateUserInput = {
  fullName: string;
  username: string;
  role?: Prisma.UserCreateInput["role"];
  password: string;
  siteId: string;
  departmentId: string;
};

type UpdateUserInput = {
  fullName?: string;
  username?: string;
  role?: Prisma.UserUpdateInput["role"];
  isActive?: boolean;
  siteId?: string;
  departmentId?: string;
};

export class UserEntity {
  public static async create(data: CreateUserInput) {
    const hashedPassword = await hashText(data.password);
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        username: data.username,
        role: data.role,
        password: hashedPassword,
        siteId: data.siteId,
        departmentId: data.departmentId,
      },
    });

    return user;
  }

  public static async getByUsername(
    username: string,
    relations: { site: true; department: true },
  ): Promise<GetUserByUsernameWithRelations | null>;
  public static async getByUsername(
    username: string,
    relations?: { site?: false; department?: false },
  ): Promise<Prisma.UserGetPayload<object> | null>;
  public static async getByUsername(
    username: string,
    relations: { site?: boolean; department?: boolean } = {},
  ) {
    return prisma.user.findUnique({
      where: {
        isActive: true,
        isTrashed: false,
        username,
      },
      include:
        relations.site || relations.department
          ? {
            site: relations.site
              ? {
                select: {
                  id: true,
                  name: true,
                },
              }
              : undefined,
            department: relations.department
              ? {
                select: {
                  id: true,
                  name: true,
                },
              }
              : undefined,
          }
          : undefined,
    });
  }

  public static async getById(id: string) {
    return prisma.user.findUnique({
      where: {
        isActive: true,
        isTrashed: false,
        id,
      },
    });
  }

  public static async getAll(
    {
      isActive = true,
      isTrashed = false,
      exclude = {}

    }: Partial<{
      isActive: boolean,
      isTrashed: boolean,
      exclude?: Record<string, unknown>
    }>
  ) {
    const users = await prisma.user.findMany({
      where: {
        isActive,
        isTrashed,
        NOT: exclude
      },

    });

    return users;
  }

  public static async update(id: string, data: UpdateUserInput) {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        username: data.username,
        role: data.role,
        isActive: data.isActive,
        siteId: data.siteId,
        departmentId: data.departmentId,
      },
    });

    return updatedUser;
  }

  public static async trash(id: string) {
    const trashedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        isTrashed: true,
      },
    });

    return trashedUser;
  }

  public static async updatePassword(id: string, newPassword: string) {
    const hashedPassword = await hashText(newPassword);
    const user = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return user;
  }
}
