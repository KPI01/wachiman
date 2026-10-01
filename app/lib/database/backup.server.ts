import { getTableColumns, sql } from "drizzle-orm";
import * as schema from "../../../db/schema";
import { db } from "../../../db/server";

type BackupRow = Record<string, unknown>;
type BackupTables = Record<string, BackupRow[]>;

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

function toDatabaseRow(table: typeof TABLES[number][1], raw: BackupRow) {
  const columns = getTableColumns(table);
  const allowedKeys = new Set(Object.keys(columns));
  if (typeof raw.id !== "string" || !raw.id || Object.keys(raw).some((key) => !allowedKeys.has(key))) {
    throw new Error("El respaldo contiene una fila incompatible con el esquema actual.");
  }
  const row: BackupRow = {};
  for (const [key, value] of Object.entries(raw)) {
    const column = columns[key as keyof typeof columns];
    const isDateColumn = (column as { dataType: string }).dataType === "date";
    row[key] = isDateColumn && typeof value === "string" ? new Date(value) : value;
    if (isDateColumn && row[key] instanceof Date && Number.isNaN(row[key].getTime())) {
      throw new Error("El respaldo contiene una fecha inválida.");
    }
  }
  return row;
}

export class DatabaseBackupEntity {
  public static async exportAll(): Promise<BackupTables> {
    const records: BackupTables = {};
    return db.transaction(async (tx) => {
      for (const [name, table] of TABLES) {
        records[name] = await tx.select().from(table) as BackupRow[];
      }
      return records;
    }, { isolationLevel: "repeatable read" });
  }

  public static async importAll(
    records: BackupTables,
    changedBy: string,
    applyFilesBeforeCommit: () => Promise<number>,
  ) {
    const tableCounts = Object.fromEntries(Object.entries(records).map(([name, rows]) => [name, rows.length]));
    await db.transaction(async (tx) => {
      for (const [name, table] of TABLES) {
        const rows = records[name].map((row) => toDatabaseRow(table, row));
        const columns = getTableColumns(table);
        const updateSet = Object.fromEntries(Object.entries(columns)
          .filter(([key]) => key !== "id")
          .map(([key, column]) => [key, sql.raw(`excluded."${column.name}"`)]));
        for (let index = 0; index < rows.length; index += 200) {
          const batch = rows.slice(index, index + 200);
          await tx.insert(table).values(batch as never[]).onConflictDoUpdate({
            target: columns.id,
            set: updateSet,
          });
        }
      }

      const fileCount = await applyFilesBeforeCommit();
      await tx.insert(schema.auditLogs).values({
        entityType: "Backup",
        entityId: "portable-backup",
        action: "BACKUP_IMPORTED",
        changedBy,
        summary: "Se importó una copia de seguridad cifrada.",
        metadata: { tables: tableCounts, files: fileCount },
      });
    });
    return tableCounts;
  }
}
