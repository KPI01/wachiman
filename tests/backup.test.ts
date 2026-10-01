import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  decryptBackupArchive,
  encryptBackupPayload,
  isSafeBackupPath,
  type BackupPayload,
} from "../app/lib/services/backup.server";

const PASSPHRASE = "frase de respaldo segura 2026";
const TABLE_NAMES = [
  "sites",
  "departments",
  "users",
  "companies",
  "workCategories",
  "allowedAreas",
  "externalWorkers",
  "appSettings",
  "workerDocuments",
  "documentReviews",
  "auditLogs",
  "accessLogVehicles",
  "plannedAccesses",
  "plannedAccessPersons",
  "workPermitActivities",
  "workPermits",
  "plannedAccessPersonDecisions",
  "workPermitSignatures",
  "accessLogs",
];

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function emptyPayload(): BackupPayload {
  const tables = Object.fromEntries(TABLE_NAMES.map((name) => [name, []]));
  return {
    manifest: {
      format: "wachiman-portable-backup",
      version: 1,
      createdAt: "2026-10-01T10:00:00.000Z",
      encryptionKeyFingerprint: sha256(Buffer.from(process.env.ENCRYPTION_KEY!, "base64")),
      tables: Object.fromEntries(TABLE_NAMES.map((name) => [name, { count: 0, sha256: sha256("[]") }])),
      files: [],
    },
    tables,
    files: [],
  };
}

function replaceHeader(archive: Buffer, update: (header: Record<string, unknown>) => void) {
  const magic = Buffer.from("WACHIMAN-PORTABLE-BACKUP\n");
  const header = JSON.parse(archive.subarray(magic.length).toString("utf8")) as Record<string, unknown>;
  update(header);
  return Buffer.concat([magic, Buffer.from(JSON.stringify(header))]);
}

describe("respaldo portátil cifrado", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 17).toString("base64");
  });

  it("cifra, comprime y recupera todas las tablas del manifiesto", async () => {
    const payload = emptyPayload();
    payload.tables.sites = [{ id: "site-1", name: "Centro" }];
    payload.manifest.tables.sites = { count: 1, sha256: sha256(JSON.stringify(payload.tables.sites)) };
    const archive = await encryptBackupPayload(payload, PASSPHRASE);

    await expect(decryptBackupArchive(archive, PASSPHRASE)).resolves.toEqual(payload);
    expect(archive.toString("utf8")).not.toContain("site-1");
    expect(archive.toString("utf8")).not.toContain("Centro");
  });

  it("rechaza contraseñas incorrectas y archivos manipulados", async () => {
    const archive = await encryptBackupPayload(emptyPayload(), PASSPHRASE);
    await expect(decryptBackupArchive(archive, "contraseña equivocada y larga"))
      .rejects.toThrow("Comprueba la contraseña");

    const modified = replaceHeader(archive, (header) => {
      const ciphertext = String(header.ciphertext);
      header.ciphertext = `${ciphertext[0] === "A" ? "B" : "A"}${ciphertext.slice(1)}`;
    });
    await expect(decryptBackupArchive(modified, PASSPHRASE)).rejects.toThrow("Comprueba la contraseña");
  });

  it("rechaza copias con una huella ENCRYPTION_KEY diferente", async () => {
    const archive = await encryptBackupPayload(emptyPayload(), PASSPHRASE);
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 18).toString("base64");
    await expect(decryptBackupArchive(archive, PASSPHRASE)).rejects.toThrow("no coincide");
  });

  it("rechaza inventarios de tabla manipulados", async () => {
    const payload = emptyPayload();
    payload.manifest.tables.sites = { count: 0, sha256: "0".repeat(64) };
    const archive = await encryptBackupPayload(payload, PASSPHRASE);
    await expect(decryptBackupArchive(archive, PASSPHRASE)).rejects.toThrow("suma de verificación");
  });

  it("rechaza archivos incompatibles y rutas inseguras aunque el manifiesto coincida", async () => {
    await expect(decryptBackupArchive(Buffer.from("otro formato"), PASSPHRASE))
      .rejects.toThrow("no es un respaldo de Wachiman compatible");

    const payload = emptyPayload();
    const contents = Buffer.from("no debe escribirse");
    const path = "uploads/../../outside.txt";
    payload.files = [{ path, content: contents.toString("base64") }];
    payload.manifest.files = [{ path, size: contents.length, sha256: sha256(contents) }];
    const archive = await encryptBackupPayload(payload, PASSPHRASE);
    await expect(decryptBackupArchive(archive, PASSPHRASE)).rejects.toThrow("ruta de archivo insegura");
  });

  it("impide rutas absolutas, ascendentes y fuera de las áreas incluidas", () => {
    expect(isSafeBackupPath("uploads/workers/worker-1/document.pdf")).toBe(true);
    expect(isSafeBackupPath("branding/logo.svg")).toBe(true);
    expect(isSafeBackupPath("uploads/../../etc/passwd")).toBe(false);
    expect(isSafeBackupPath("branding/../.env")).toBe(false);
    expect(isSafeBackupPath("uploads\\..\\secret.txt")).toBe(false);
    expect(isSafeBackupPath("/etc/passwd")).toBe(false);
  });
});
