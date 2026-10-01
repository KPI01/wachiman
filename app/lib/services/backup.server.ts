import { createHash, createCipheriv, createDecipheriv, pbkdf2, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { deflateRaw, inflateRaw } from "node:zlib";
import * as schema from "../../../db/schema";
import { DatabaseBackupEntity } from "../database/backup.server";

const pbkdf2Async = promisify(pbkdf2);
const deflateRawAsync = promisify(deflateRaw);
const inflateRawAsync = promisify(inflateRaw);
const ARCHIVE_MAGIC = "WACHIMAN-PORTABLE-BACKUP\n";
const FORMAT_VERSION = 1;
const KDF_ITERATIONS = 310_000;
const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 1024 * 1024 * 1024;
const MIN_PASSPHRASE_LENGTH = 12;

const TABLES = [
  ["sites", schema.sites],
  ["departments", schema.departments],
  ["users", schema.users],
  ["companies", schema.companies],
  ["workCategories", schema.workCategories],
  ["allowedAreas", schema.allowedAreas],
  ["externalWorkers", schema.externalWorkers],
  ["appSettings", schema.appSettings],
  ["workerDocuments", schema.workerDocuments],
  ["documentReviews", schema.documentReviews],
  ["auditLogs", schema.auditLogs],
  ["accessLogVehicles", schema.accessLogVehicles],
  ["plannedAccesses", schema.plannedAccesses],
  ["plannedAccessPersons", schema.plannedAccessPersons],
  ["workPermitActivities", schema.workPermitActivities],
  ["workPermits", schema.workPermits],
  ["plannedAccessPersonDecisions", schema.plannedAccessPersonDecisions],
  ["workPermitSignatures", schema.workPermitSignatures],
  ["accessLogs", schema.accessLogs],
] as const;

type BackupRow = Record<string, unknown>;
export type BackupPayload = {
  manifest: {
    format: "wachiman-portable-backup";
    version: number;
    createdAt: string;
    encryptionKeyFingerprint: string;
    tables: Record<string, { count: number; sha256: string }>;
    files: Array<{ path: string; size: number; sha256: string }>;
  };
  tables: Record<string, BackupRow[]>;
  files: Array<{ path: string; content: string }>;
};

type EncryptedArchive = {
  version: number;
  algorithm: "aes-256-gcm";
  kdf: "pbkdf2-sha256";
  iterations: number;
  salt: string;
  iv: string;
  tag: string;
  ciphertext: string;
};

export type BackupSummary = {
  createdAt: string;
  tables: Record<string, number>;
  files: number;
  totalFileBytes: number;
};

function sha256(value: Uint8Array | string) {
  return createHash("sha256").update(value).digest("hex");
}

function getEncryptionKey() {
  const encoded = process.env.ENCRYPTION_KEY;
  if (!encoded) throw new Error("ENCRYPTION_KEY no está definida en el servidor.");

  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32 || key.toString("base64") !== encoded) {
    throw new Error("ENCRYPTION_KEY debe ser una clave válida de 32 bytes codificada en base64.");
  }
  return key;
}

function checkPassphrase(passphrase: string) {
  if (passphrase.trim().length < MIN_PASSPHRASE_LENGTH) {
    throw new Error(`La contraseña del archivo debe tener al menos ${MIN_PASSPHRASE_LENGTH} caracteres.`);
  }
}

async function collectFiles(rootLabel: "uploads" | "branding", rootPath: string) {
  const absoluteRoot = path.resolve(rootPath);
  let rootStat;
  try {
    rootStat = await lstat(absoluteRoot);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error(`La ruta de ${rootLabel} debe ser un directorio seguro.`);
  }

  const files: Array<{ path: string; content: string }> = [];
  async function walk(current: string, relative: string) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const childRelative = relative ? path.join(relative, entry.name) : entry.name;
      const stat = await lstat(fullPath);
      if (stat.isSymbolicLink()) {
        throw new Error(`No se pueden incluir enlaces simbólicos en los respaldos (${rootLabel}/${childRelative}).`);
      }
      if (stat.isDirectory()) {
        await walk(fullPath, childRelative);
        continue;
      }
      if (!stat.isFile()) continue;
      const bytes = await readFile(fullPath);
      files.push({
        path: `${rootLabel}/${childRelative.split(path.sep).join("/")}`,
        content: bytes.toString("base64"),
      });
    }
  }
  await walk(absoluteRoot, "");
  return files;
}

function getStorageRoots() {
  return {
    uploads: path.resolve(process.env.UPLOADS_BASE_PATH || "./uploads"),
    branding: path.resolve(process.env.BRANDING_BASE_PATH || "./public/branding"),
  };
}

export function isSafeBackupPath(relativePath: string) {
  if (!relativePath || relativePath.includes("\\") || relativePath.includes("\0")) return false;
  const segments = relativePath.split("/");
  if (segments.length < 2 || segments.some((part) => !part || part === "." || part === "..")) return false;
  if (segments.some((part) => /[<>:"|?*\u0000-\u001f]/.test(part))) return false;
  if (segments[0] !== "uploads" && segments[0] !== "branding") return false;
  return !path.posix.isAbsolute(relativePath);
}

function parseArchive(buffer: Buffer): EncryptedArchive {
  if (buffer.length > MAX_ARCHIVE_BYTES) throw new Error("El archivo supera el tamaño máximo permitido.");
  if (!buffer.subarray(0, Buffer.byteLength(ARCHIVE_MAGIC)).equals(Buffer.from(ARCHIVE_MAGIC))) {
    throw new Error("El archivo no es un respaldo de Wachiman compatible.");
  }
  let value: unknown;
  try {
    value = JSON.parse(buffer.subarray(Buffer.byteLength(ARCHIVE_MAGIC)).toString("utf8"));
  } catch {
    throw new Error("El encabezado del respaldo está dañado.");
  }
  if (!value || typeof value !== "object") throw new Error("El encabezado del respaldo no es válido.");
  const archive = value as Record<string, unknown>;
  if (
    archive.version !== FORMAT_VERSION ||
    archive.algorithm !== "aes-256-gcm" ||
    archive.kdf !== "pbkdf2-sha256" ||
    archive.iterations !== KDF_ITERATIONS ||
    typeof archive.salt !== "string" ||
    typeof archive.iv !== "string" ||
    typeof archive.tag !== "string" ||
    typeof archive.ciphertext !== "string"
  ) {
    throw new Error("La versión o el algoritmo del respaldo no es compatible.");
  }
  return archive as EncryptedArchive;
}

function validatePayload(value: unknown): BackupPayload {
  if (!value || typeof value !== "object") throw new Error("El contenido del respaldo no es válido.");
  const payload = value as Partial<BackupPayload>;
  const manifest = payload.manifest;
  if (
    !manifest ||
    manifest.format !== "wachiman-portable-backup" ||
    manifest.version !== FORMAT_VERSION ||
    typeof manifest.createdAt !== "string" ||
    typeof manifest.encryptionKeyFingerprint !== "string" ||
    !manifest.tables ||
    !payload.tables ||
    !Array.isArray(payload.files) ||
    !Array.isArray(manifest.files)
  ) {
    throw new Error("El manifiesto del respaldo está incompleto o no es compatible.");
  }

  const allowedTables = new Set<string>(TABLES.map(([name]) => name));
  if (Object.keys(payload.tables).length !== allowedTables.size) {
    throw new Error("El respaldo no incluye todas las tablas de la aplicación.");
  }
  for (const [name] of TABLES) {
    const rows = payload.tables[name];
    const tableManifest = manifest.tables[name];
    if (!Array.isArray(rows) || !tableManifest || tableManifest.count !== rows.length) {
      throw new Error(`La tabla ${name} no coincide con el manifiesto.`);
    }
    if (sha256(JSON.stringify(rows)) !== tableManifest.sha256) {
      throw new Error(`La suma de verificación de la tabla ${name} no coincide.`);
    }
  }
  if (Object.keys(payload.tables).some((name) => !allowedTables.has(name))) {
    throw new Error("El respaldo contiene tablas desconocidas.");
  }

  const manifestFiles = new Map(manifest.files.map((file) => [file.path, file]));
  if (manifestFiles.size !== manifest.files.length || manifestFiles.size !== payload.files.length) {
    throw new Error("El inventario de archivos no coincide con el manifiesto.");
  }
  const seenPaths = new Set<string>();
  for (const file of payload.files) {
    if (!file || typeof file.path !== "string" || typeof file.content !== "string" || !isSafeBackupPath(file.path)) {
      throw new Error("El respaldo contiene una ruta de archivo insegura.");
    }
    if (seenPaths.has(file.path)) throw new Error("El respaldo repite rutas de archivo.");
    seenPaths.add(file.path);
    const content = Buffer.from(file.content, "base64");
    const fileManifest = manifestFiles.get(file.path);
    if (
      !fileManifest ||
      content.toString("base64") !== file.content ||
      fileManifest.size !== content.length ||
      fileManifest.sha256 !== sha256(content)
    ) {
      throw new Error(`El archivo ${file.path} no coincide con el manifiesto.`);
    }
  }
  return payload as BackupPayload;
}

export async function encryptBackupPayload(payload: BackupPayload, passphrase: string) {
  checkPassphrase(passphrase);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const derivedKey = await pbkdf2Async(passphrase, salt, KDF_ITERATIONS, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", derivedKey, iv);
  const compressed = await deflateRawAsync(Buffer.from(JSON.stringify(payload)));
  const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
  const archive: EncryptedArchive = {
    version: FORMAT_VERSION,
    algorithm: "aes-256-gcm",
    kdf: "pbkdf2-sha256",
    iterations: KDF_ITERATIONS,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
  return Buffer.concat([Buffer.from(ARCHIVE_MAGIC), Buffer.from(JSON.stringify(archive))]);
}

export async function decryptBackupArchive(buffer: Buffer, passphrase: string) {
  checkPassphrase(passphrase);
  const archive = parseArchive(buffer);
  const salt = Buffer.from(archive.salt, "base64");
  const iv = Buffer.from(archive.iv, "base64");
  const tag = Buffer.from(archive.tag, "base64");
  const ciphertext = Buffer.from(archive.ciphertext, "base64");
  if (salt.length !== 16 || iv.length !== 12 || tag.length !== 16 || ciphertext.toString("base64") !== archive.ciphertext) {
    throw new Error("El respaldo cifrado está dañado.");
  }

  let payloadBytes: Buffer;
  try {
    const key = await pbkdf2Async(passphrase, salt, KDF_ITERATIONS, 32, "sha256");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const compressed = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    payloadBytes = await inflateRawAsync(compressed, { maxOutputLength: MAX_UNCOMPRESSED_BYTES });
  } catch {
    throw new Error("No se pudo abrir el respaldo. Comprueba la contraseña y que el archivo no esté dañado.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadBytes.toString("utf8"));
  } catch {
    throw new Error("El contenido descifrado del respaldo no es válido.");
  }
  const payload = validatePayload(parsed);
  const currentFingerprint = sha256(getEncryptionKey());
  if (payload.manifest.encryptionKeyFingerprint !== currentFingerprint) {
    throw new Error("La ENCRYPTION_KEY del servidor no coincide con la usada para crear este respaldo.");
  }
  return payload;
}

export async function createBackupArchive(passphrase: string) {
  checkPassphrase(passphrase);
  const key = getEncryptionKey();
  const [tables, uploads, branding] = await Promise.all([
    DatabaseBackupEntity.exportAll(),
    collectFiles("uploads", getStorageRoots().uploads),
    collectFiles("branding", getStorageRoots().branding),
  ]);
  const files = [...uploads, ...branding].sort((a, b) => a.path.localeCompare(b.path));
  const tableManifest = Object.fromEntries(Object.entries(tables).map(([name, rows]) => [
    name,
    { count: rows.length, sha256: sha256(JSON.stringify(rows)) },
  ]));
  const manifestFiles = files.map((file) => {
    const content = Buffer.from(file.content, "base64");
    return { path: file.path, size: content.length, sha256: sha256(content) };
  });
  const payload: BackupPayload = {
    manifest: {
      format: "wachiman-portable-backup",
      version: FORMAT_VERSION,
      createdAt: new Date().toISOString(),
      encryptionKeyFingerprint: sha256(key),
      tables: tableManifest,
      files: manifestFiles,
    },
    tables,
    files,
  };
  const archive = await encryptBackupPayload(payload, passphrase);
  if (archive.length > MAX_ARCHIVE_BYTES) {
    throw new Error("El respaldo supera el tamaño máximo admitido de 512 MB.");
  }
  return {
    archive,
    summary: summarizeBackup(payload),
  };
}

function summarizeBackup(payload: BackupPayload): BackupSummary {
  return {
    createdAt: payload.manifest.createdAt,
    tables: Object.fromEntries(Object.entries(payload.tables).map(([name, rows]) => [name, rows.length])),
    files: payload.files.length,
    totalFileBytes: payload.manifest.files.reduce((sum, file) => sum + file.size, 0),
  };
}

export async function inspectBackupArchive(buffer: Buffer, passphrase: string) {
  const payload = await decryptBackupArchive(buffer, passphrase);
  return { payload, summary: summarizeBackup(payload) };
}

async function prepareTarget(root: string, relative: string) {
  const realRoot = path.resolve(root);
  await mkdir(realRoot, { recursive: true });
  const rootStat = await lstat(realRoot);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) throw new Error("La carpeta de destino no es segura.");
  let current = realRoot;
  const segments = relative.split("/");
  for (const segment of segments.slice(0, -1)) {
    current = path.join(current, segment);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error("El respaldo apunta a una ruta insegura.");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await mkdir(current);
    }
  }
  const destination = path.join(realRoot, ...segments);
  const relativeFromRoot = path.relative(realRoot, destination);
  if (relativeFromRoot.startsWith("..") || path.isAbsolute(relativeFromRoot)) {
    throw new Error("El respaldo apunta fuera de las carpetas de almacenamiento.");
  }
  try {
    const targetStat = await lstat(destination);
    if (targetStat.isSymbolicLink() || !targetStat.isFile()) throw new Error("El respaldo apunta a un archivo de destino inseguro.");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return destination;
}

async function restoreFilesystemChanges(changes: Array<{ destination: string; previous: Buffer | null }>) {
  for (const change of [...changes].reverse()) {
    if (change.previous) await writeFile(change.destination, change.previous);
    else await rm(change.destination, { force: true });
  }
}

export async function importBackupPayload(payload: BackupPayload, changedBy: string) {
  const roots = getStorageRoots();
  const changes: Array<{ destination: string; previous: Buffer | null }> = [];
  const preparedFiles: Array<{ destination: string; previous: Buffer | null; content: Buffer }> = [];
  for (const file of payload.files) {
    if (!isSafeBackupPath(file.path)) throw new Error("El respaldo contiene una ruta de archivo insegura.");
    const [area, ...segments] = file.path.split("/");
    const destination = await prepareTarget(roots[area as "uploads" | "branding"], segments.join("/"));
    let previous: Buffer | null = null;
    try {
      previous = await readFile(destination);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    preparedFiles.push({ destination, previous, content: Buffer.from(file.content, "base64") });
  }

  try {
    const tableCounts = await DatabaseBackupEntity.importAll(payload.tables, changedBy, async () => {
      for (const file of preparedFiles) {
        changes.push({ destination: file.destination, previous: file.previous });
        await writeFile(file.destination, file.content, { mode: 0o600 });
      }
      return preparedFiles.length;
    });
    return { tables: tableCounts, files: preparedFiles.length };
  } catch (error) {
    await restoreFilesystemChanges(changes);
    throw error;
  }
}

export function createBackupDownloadResponse(archive: Buffer) {
  const date = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  return new Response(new Uint8Array(archive), {
    headers: {
      "Content-Type": "application/vnd.wachiman.backup+json",
      "Content-Disposition": `attachment; filename="wachiman-${date}.backup"`,
      "Cache-Control": "no-store",
      "Content-Length": String(archive.length),
    },
  });
}

export function getBackupFileName(file: File | null) {
  if (!file || file.size === 0) throw new Error("Selecciona un archivo de respaldo.");
  if (file.size > MAX_ARCHIVE_BYTES) throw new Error("El archivo supera el tamaño máximo permitido.");
  return file;
}
