import "dotenv/config";

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

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
  const fullName = process.env.ADMIN_FULL_NAME ?? "Administrador";
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD;
  const siteName = process.env.SITE_NAME ?? "Sitio principal";
  const siteSlug = process.env.SITE_SLUG ?? "PRINCIPAL";
  const departmentName = process.env.DEPARTMENT_NAME ?? "General";
  const departmentSlug = process.env.DEPARTMENT_SLUG ?? "GENERAL";

  if (!connectionString) {
    throw new Error("DATABASE_URL no esta definido");
  }

  if (!password) {
    throw new Error("ADMIN_PASSWORD no esta definido");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const site = await prisma.site.upsert({
      where: { slug: siteSlug },
      update: {
        name: siteName,
      },
      create: {
        name: siteName,
        slug: siteSlug,
      },
    });

    const department = await prisma.department.upsert({
      where: { slug: departmentSlug },
      update: {
        name: departmentName,
      },
      create: {
        name: departmentName,
        slug: departmentSlug,
      },
    });

    const hashedPassword = await hashText(password);

    await prisma.user.upsert({
      where: { username },
      update: {
        fullName,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        isTrashed: false,
        siteId: site.id,
        departmentId: department.id,
      },
      create: {
        fullName,
        username,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        isTrashed: false,
        siteId: site.id,
        departmentId: department.id,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
