import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { createPostgresDb, closeDatabasePool } from "../../db/client";
import { departments, sites, users } from "../../db/schema";
import { hashText } from "../../app/lib/hash.server";

const e2eUserId = "e2e-backup-access-check";
const e2eUsername = "e2e_backup_access_check";
const e2ePassword = "usuario-e2e-sin-admin";
const archivePassword = "respaldo e2e seguro 2026";
const uploadsPath = path.resolve(process.env.UPLOADS_BASE_PATH || ".e2e-data/uploads");
const brandingPath = path.resolve(process.env.BRANDING_BASE_PATH || ".e2e-data/branding");
const uploadFixture = path.join(uploadsPath, "workers", "e2e-fixture.txt");
const brandingFixture = path.join(brandingPath, "e2e-fixture.txt");

test.beforeAll(async () => {
  const db = createPostgresDb(process.env.DATABASE_URL);
  const [site, department] = await Promise.all([
    db.select().from(sites).where(eq(sites.id, "site-1")).limit(1),
    db.select().from(departments).where(eq(departments.id, "dept-3")).limit(1),
  ]);
  if (!site[0] || !department[0]) {
    throw new Error("La base de datos de E2E debe tener las migraciones y el seed inicial aplicados.");
  }
  const password = await hashText(e2ePassword);
  await db.insert(users).values({
    id: e2eUserId,
    fullName: "Operador de pruebas",
    username: e2eUsername,
    password,
    role: "ACCESS_OPERATOR",
    siteId: site[0].id,
    departmentId: department[0].id,
  }).onConflictDoUpdate({
    target: users.id,
    set: { password, username: e2eUsername, role: "ACCESS_OPERATOR", isActive: true, isTrashed: false },
  });
  await mkdir(path.dirname(uploadFixture), { recursive: true });
  await mkdir(brandingPath, { recursive: true });
  await writeFile(uploadFixture, "adjunto de prueba para restauración");
  await writeFile(brandingFixture, "recurso de marca de prueba");
});

test.afterAll(async () => {
  await rm(uploadFixture, { force: true });
  await rm(brandingFixture, { force: true });
  try {
    const db = createPostgresDb(process.env.DATABASE_URL);
    await db.delete(users).where(eq(users.id, e2eUserId));
  } finally {
    await closeDatabasePool();
  }
});

async function signIn(page: import("@playwright/test").Page, username: string, password: string) {
  await page.goto("/login");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  const loginResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/login") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Enviar" }).click();
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBe(true);
  await expect(page).not.toHaveURL(/\/login$/);
}

test("el panel de respaldos queda restringido a administradores", async ({ page }) => {
  await page.goto("/admin/backups");
  await expect(page).toHaveURL(/\/login$/);

  await signIn(page, e2eUsername, e2ePassword);
  await page.goto("/admin/backups");
  await expect(page).toHaveURL(/\/unauthorized\?/);
});

test("exporta, valida e importa una copia con adjuntos y archivos de marca", async ({ page }, testInfo) => {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "demo123";
  await signIn(page, adminUsername, adminPassword);
  await page.goto("/admin/backups");
  await expect(page.getByRole("heading", { name: "Copias de seguridad" })).toBeVisible();

  await page.locator("#exportCurrentPassword").fill("contraseña incorrecta de prueba");
  await page.locator("#exportArchivePassword").fill(archivePassword);
  await page.locator("#exportArchivePasswordConfirm").fill(archivePassword);
  await page.getByRole("button", { name: "Descargar copia cifrada" }).click();
  await expect(page.getByText("La contraseña actual no es correcta. Vuelve a autenticarte para continuar.")).toBeVisible();

  await page.locator("#exportCurrentPassword").fill(adminPassword);
  await page.locator("#exportArchivePassword").fill(archivePassword);
  await page.locator("#exportArchivePasswordConfirm").fill(archivePassword);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar copia cifrada" }).click();
  const download = await downloadEvent;
  const archivePath = testInfo.outputPath("backup-e2e.backup");
  await download.saveAs(archivePath);
  const archiveBytes = await readFile(archivePath);
  expect(archiveBytes.length).toBeGreaterThan(100);

  await rm(uploadFixture, { force: true });
  await rm(brandingFixture, { force: true });

  await page.reload();
  await page.locator("#previewBackupFile").setInputFiles(archivePath);
  await page.locator("#previewArchivePassword").fill(archivePassword);
  await page.locator("#previewCurrentPassword").fill(adminPassword);
  await page.getByRole("button", { name: "Validar y mostrar resumen" }).click();
  await expect(page.getByText(/Respaldo válido/)).toBeVisible();
  await expect(page.getByText(/2 archivos/)).toBeVisible();

  await page.locator("#importBackupFile").setInputFiles(archivePath);
  await page.locator("#importArchivePassword").fill(archivePassword);
  await page.locator("#importCurrentPassword").fill(adminPassword);
  await page.locator("#importConfirmation").fill("IMPORTAR");
  await page.getByRole("button", { name: "Importar y combinar datos" }).click();
  await expect(page.getByText("Restauración completada")).toBeVisible();
  await expect(readFile(uploadFixture)).resolves.toEqual(Buffer.from("adjunto de prueba para restauración"));
  await expect(readFile(brandingFixture)).resolves.toEqual(Buffer.from("recurso de marca de prueba"));
  expect(archiveBytes.includes(Buffer.from("adjunto de prueba para restauración"))).toBe(false);
});
