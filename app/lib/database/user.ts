import { performance } from "node:perf_hooks";
import type { Prisma } from "../../../generated/prisma/client";
import { hashText } from "../hash";
import { prisma } from "../prisma";

export async function createUser(data: Prisma.UserCreateInput) {
  const start = performance.now();

  try {
    const hashedPassword = await hashText(data.password);
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        username: data.username,
        password: hashedPassword,
      },
    });

    return user;
  } finally {
    console.log(`[createUser] ${(performance.now() - start).toFixed(2)}ms`);
  }
}

export async function getUserByUsername(username: string) {
  const start = performance.now();

  try {
    return prisma.user.findUnique({
      where: {
        isActive: true,
        isTrashed: false,
        username,
      },
    });
  } finally {
    console.log(
      `[getUserByUsername] getUserByUsername took ${(performance.now() - start).toFixed(2)}ms`,
    );
  }
}
