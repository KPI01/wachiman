import { performance } from "node:perf_hooks";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import { hashText } from "../hash.server";
import { prisma } from "../prisma.server";

type GetUserByUsernameWithSite = Prisma.UserGetPayload<{
  include: {
    site: {
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
    const start = performance.now();

    try {
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
    } finally {
      console.log(`[UserEntity.create] ${(performance.now() - start).toFixed(2)}ms`);
    }
  }

  public static async getByUsername(
    username: string,
    relations: { site: true },
  ): Promise<GetUserByUsernameWithSite | null>;
  public static async getByUsername(
    username: string,
    relations?: { site: false },
  ): Promise<Prisma.UserGetPayload<object> | null>;
  public static async getByUsername(
    username: string,
    relations: { site: boolean } = { site: false },
  ) {
    const start = performance.now();

    try {
      return prisma.user.findUnique({
        where: {
          isActive: true,
          isTrashed: false,
          username,
        },
        include: relations.site
          ? {
              site: {
                select: {
                  id: true,
                  name: true,
                },
              },
            }
          : undefined,
      });
    } finally {
      console.log(
        `[UserEntity.getByUsername] ${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  }

  public static async getById(id: string) {
    const start = performance.now();

    try {
      return prisma.user.findUnique({
        where: {
          isActive: true,
          isTrashed: false,
          id,
        },
      });
    } finally {
      console.log(`[UserEntity.getById] ${(performance.now() - start).toFixed(2)}ms`);
    }
  }

  public static async getAll(
    isActive: boolean = true,
    isTrashed: boolean = false,
  ) {
    const start = performance.now();

    try {
      const users = await prisma.user.findMany({
        where: {
          isActive,
          isTrashed,
        },
      });

      return users;
    } finally {
      console.log(`[UserEntity.getAll] ${(performance.now() - start).toFixed(2)}ms`);
    }
  }

  public static async update(id: string, data: UpdateUserInput) {
    const start = performance.now();

    try {
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
    } finally {
      console.log(`[UserEntity.update] ${(performance.now() - start).toFixed(2)}ms`);
    }
  }

  public static async trash(id: string) {
    const start = performance.now();

    try {
      const trashedUser = await prisma.user.update({
        where: { id },
        data: {
          isActive: false,
          isTrashed: true,
        },
      });

      return trashedUser;
    } finally {
      console.log(`[UserEntity.trash] ${(performance.now() - start).toFixed(2)}ms`);
    }
  }
}
