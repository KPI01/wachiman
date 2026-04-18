import { performance } from "node:perf_hooks";
import type { Prisma } from "../../../generated/prisma/client";
import { hashText } from "../hash";
import { prisma } from "../prisma";

type CreateUserInput = {
  fullName: string;
  username: string;
  role?: Prisma.UserCreateInput["role"];
  password: string;
  siteId: string;
};

type UpdateUserInput = {
  fullName?: string;
  username?: string;
  role?: Prisma.UserUpdateInput["role"];
  isActive?: boolean;
  siteId?: string;
};

export async function createUser(data: CreateUserInput) {
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
      },
    });

    return user;
  } finally {
    console.log(`[createUser] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function getUserByUsername(
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
      `[getUserByUsername] ${(performance.now() - start).toFixed(2)}ms`,
    );
  }
}

export async function getUserById(id: string) {
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
    console.log(`[getUserById] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function getUsers(
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
    console.log(`[getUsers] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function updateUser(id: string, data: UpdateUserInput) {
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
      },
    });

    return updatedUser;
  } finally {
    console.log(`[updateUser] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function trashUser(id: string) {
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
    console.log(`[trashUser] ${(performance.now() - start).toFixed(2)}ms`);
  }
}
