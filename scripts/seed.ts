import "dotenv/config";

import { createLocalDb } from "../db/client";
import { departments, sites, users } from "../db/schema";
import { hashText } from "../app/lib/hash.server";

async function main() {
  const fullName = process.env.ADMIN_FULL_NAME ?? "Administrador";
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = "demo123";
  const siteName = process.env.SITE_NAME ?? "Sitio principal";
  const siteSlug = process.env.SITE_SLUG ?? "PRINCIPAL";
  const departmentName = process.env.DEPARTMENT_NAME ?? "General";
  const departmentSlug = process.env.DEPARTMENT_SLUG ?? "GENERAL";

  const db = createLocalDb();

  const [site] = await db
    .insert(sites)
    .values({ name: siteName, slug: siteSlug })
    .returning();

  const [department] = await db
    .insert(departments)
    .values({ name: departmentName, slug: departmentSlug })
    .returning();

  const hashedPassword = await hashText(password);

  await db.insert(users).values({
    fullName,
    username,
    password: hashedPassword,
    role: "ADMIN",
    isActive: true,
    isTrashed: false,
    siteId: site.id,
    departmentId: department.id,
  });

  console.log("Seed completed successfully. Admin password: demo123");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
