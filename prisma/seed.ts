import "dotenv/config";

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const scrypt = promisify(scryptCallback);

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const HASH_SEPARATOR = ":";

async function hashText(text: string) {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = (await scrypt(text, salt, KEY_LENGTH)) as Buffer;

  return `${salt}${HASH_SEPARATOR}${derivedKey.toString("hex")}`;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const fullName = process.env.SEED_ADMIN_FULL_NAME ?? "Administrador";
  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!connectionString) {
    throw new Error("DATABASE_URL no esta definido");
  }

  if (!password) {
    throw new Error("SEED_ADMIN_PASSWORD no esta definido");
  }

  const adapter = new PrismaBetterSqlite3({ url: connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const hashedPassword = await hashText(password);

    await prisma.user.upsert({
      where: { username },
      update: {
        fullName,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        isTrashed: false,
      },
      create: {
        fullName,
        username,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        isTrashed: false,
      },
    });

    console.log(`Admin inicial preparado: ${username}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
