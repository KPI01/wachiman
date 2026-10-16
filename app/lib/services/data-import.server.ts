import * as XLSX from "xlsx";
import { DataImportEntity, type ImportIssue, type ImportRecord } from "../database/data-import.server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ROWS = 10_000;

const HEADER_ALIASES = {
  company: ["empresa", "nombre empresa", "razon social"],
  worker: ["trabajador", "nombre trabajador", "nombre completo", "trabajador nombre"],
  legalId: ["dni", "nie", "nif", "documento identificacion", "identificacion"],
  area: ["lugar de trabajo autorizado", "lugar autorizado", "area autorizada", "lugar de trabajo"],
  task: ["tareas a realizar", "tarea a realizar", "tarea", "trabajo a realizar", "tipo de trabajo"],
} as const;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function cellText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseWorkbook(buffer: ArrayBuffer): ImportRecord[] {
  const workbook = XLSX.read(buffer, { type: "array", raw: false, cellDates: false });
  const records: ImportRecord[] = [];

  for (const sheetName of workbook.SheetNames.slice(0, 20)) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false, blankrows: false });
    if (rows.length > MAX_ROWS) throw new Error(`La hoja «${sheetName}» supera el máximo de ${MAX_ROWS} filas.`);
    let columnIndexes: Partial<Record<keyof typeof HEADER_ALIASES, number>> | null = null;
    let headerRowIndex = -1;

    rows.forEach((row, index) => {
      const normalizedCells = row.map((cell) => normalize(cellText(cell)));
      const found: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {};
      for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<[keyof typeof HEADER_ALIASES, readonly string[]]>) {
        const col = normalizedCells.findIndex((value) => aliases.includes(value));
        if (col >= 0) found[field] = col;
      }
      const headerMatches = Object.keys(found).length;
      if (headerMatches >= 3 && found.company !== undefined && found.worker !== undefined && found.legalId !== undefined) {
        columnIndexes = found;
        headerRowIndex = index;
        return;
      }
      if (!columnIndexes || index <= headerRowIndex) return;

      const get = (field: keyof typeof HEADER_ALIASES) => {
        const column = columnIndexes?.[field];
        return column === undefined ? "" : cellText(row[column]);
      };
      const record: ImportRecord = {
        rowNumber: index + 1,
        company: get("company"),
        worker: get("worker"),
        legalId: get("legalId"),
        area: get("area"),
        task: get("task"),
      };
      if (!record.company && !record.worker && !record.legalId && !record.area && !record.task) return;
      if (/^(planta:|accesos autorizados)/i.test(record.company) || normalize(record.company) === "empresa") return;
      if ([record.worker, record.legalId, record.area, record.task].some((value) =>
        ["trabajador", "dni", "lugar de trabajo autorizado", "tareas a realizar"].includes(normalize(value)),
      )) return;
      records.push(record);
    });
  }
  return records;
}

function selectRows(records: ImportRecord[]) {
  const valid: ImportRecord[] = [];
  const issues: ImportIssue[] = [];
  const seenLegalIds = new Set<string>();
  for (const row of records) {
    const missing: string[] = [];
    if (!row.company) missing.push("Falta la empresa.");
    if (!row.worker) missing.push("Falta el trabajador.");
    if (!row.legalId) missing.push("Falta el DNI/NIE.");
    if (!row.area) missing.push("Falta el lugar de trabajo autorizado.");
    if (!row.task) missing.push("Falta la tarea a realizar.");
    if (missing.length) {
      issues.push({ rowNumber: row.rowNumber, label: row.worker || row.company || `Fila ${row.rowNumber}`, reason: missing.join(" ") });
      continue;
    }
    const legalId = row.legalId.trim().toUpperCase();
    if (seenLegalIds.has(legalId)) {
      issues.push({ rowNumber: row.rowNumber, label: row.worker, reason: "DNI repetido en el archivo; se omitirá esta fila." });
      continue;
    }
    seenLegalIds.add(legalId);
    valid.push({ ...row, legalId });
  }
  return { valid, issues };
}

function validateFile(file: File) {
  const extension = file.name.toLowerCase().split(".").at(-1);
  if (!file.size || file.size > MAX_FILE_SIZE) throw new Error("El archivo está vacío o supera el límite de 10 MB.");
  if (!extension || !["xlsx", "xls", "csv"].includes(extension)) {
    throw new Error("Selecciona un archivo Excel (.xlsx o .xls) o CSV.");
  }
}

function validateDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Selecciona la fecha del acceso planificado.");
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new Error("La fecha indicada no es válida.");
  }
}

async function parseInput(input: { file: File; siteId: string; date: string }) {
  validateFile(input.file);
  validateDate(input.date);
  if (!(await DataImportEntity.getSites()).some((site) => site.id === input.siteId)) {
    throw new Error("Selecciona un centro de trabajo válido.");
  }
  const rows = parseWorkbook(await input.file.arrayBuffer());
  if (!rows.length) throw new Error("No se encontraron filas con las columnas esperadas.");
  return { rows, analysis: selectRows(rows) };
}

export async function getDataImportSites() {
  return DataImportEntity.getSites();
}

export async function previewDataImport(input: { file: File; siteId: string; date: string }) {
  const { rows, analysis } = await parseInput(input);
  const conflicts = await DataImportEntity.previewPlannedAccessRecords({
    records: analysis.valid, siteId: input.siteId, date: input.date,
  });
  return {
    totalRows: rows.length,
    importable: conflicts.accepted.length,
    issues: [...analysis.issues, ...conflicts.issues],
    records: conflicts.accepted.slice(0, 100),
    truncated: conflicts.accepted.length > 100,
    date: input.date,
  };
}

export async function importData(input: {
  file: File;
  siteId: string;
  date: string;
  changedBy: string;
  departmentId: string;
}) {
  const { analysis } = await parseInput(input);
  const result = await DataImportEntity.importPlannedAccessRecords({
    records: analysis.valid,
    siteId: input.siteId,
    date: input.date,
    changedBy: input.changedBy,
    departmentId: input.departmentId,
    fileName: input.file.name,
  });
  return { ...result, skipped: result.skipped + analysis.issues.length, issues: [...analysis.issues, ...result.issues] };
}
