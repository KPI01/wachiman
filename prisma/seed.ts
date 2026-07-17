import "dotenv/config";

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import { PrismaClient } from "./generated/prisma/client";
import { createLocalPrismaClient } from "./lib";

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
  const fullName = process.env.ADMIN_FULL_NAME ?? "Administrador";
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = "demo123";
  const siteName = process.env.SITE_NAME ?? "Sitio principal";
  const siteSlug = process.env.SITE_SLUG ?? "PRINCIPAL";
  const departmentName = process.env.DEPARTMENT_NAME ?? "General";
  const departmentSlug = process.env.DEPARTMENT_SLUG ?? "GENERAL";

  const prisma = createLocalPrismaClient();

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
