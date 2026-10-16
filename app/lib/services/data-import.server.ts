import * as XLSX from "xlsx";
import { DataImportEntity, type ImportIssue, type ImportRecord, type ImportType } from "../database/data-import.server";

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

function selectRecords(type: ImportType, records: ImportRecord[]) {
  const valid: ImportRecord[] = [];
  const issues: ImportIssue[] = [];
  const seen = new Set<string>();

  for (const record of records) {
    let key = "";
    let label = "Fila";
    let missing: string[] = [];
    if (type === "companies") {
      key = normalize(record.company);
      label = record.company || `Fila ${record.rowNumber}`;
      if (!key) missing = ["Falta la empresa."];
    } else if (type === "workCategories") {
      key = normalize(record.task);
      label = record.task || `Fila ${record.rowNumber}`;
      if (!key) missing = ["Falta la tarea de trabajo."];
    } else if (type === "allowedAreas") {
      key = normalize(record.area);
      label = record.area || `Fila ${record.rowNumber}`;
      if (!key) missing = ["Falta el lugar de trabajo autorizado."];
    } else {
      key = record.legalId.trim().toUpperCase();
      label = record.worker || `Fila ${record.rowNumber}`;
      if (!record.company) missing.push("Falta la empresa.");
      if (!record.worker) missing.push("Falta el trabajador.");
      if (!key) missing.push("Falta el DNI.");
      if (!record.task) missing.push("Falta la tarea de trabajo.");
    }

    if (missing.length) {
      issues.push({ rowNumber: record.rowNumber, label, reason: missing.join(" ") });
      continue;
    }
    if (seen.has(key)) {
      issues.push({ rowNumber: record.rowNumber, label, reason: "Registro repetido dentro del archivo; se usará la primera fila." });
      continue;
    }
    seen.add(key);
    valid.push(record);
  }
  return { valid, issues };
}

export async function getDataImportSites() {
  return DataImportEntity.getSites();
}

export async function previewDataImport(input: {
  file: File;
  type: ImportType;
  siteId?: string;
}) {
  validateFile(input.file);
  if (input.type === "allowedAreas" && !input.siteId) throw new Error("Selecciona el centro al que pertenecen las áreas.");
  const rows = parseWorkbook(await input.file.arrayBuffer());
  const analysis = selectRecords(input.type, rows);
  const conflicts = await DataImportEntity.previewRecords({ type: input.type, records: analysis.valid, siteId: input.siteId });
  return {
    totalRows: rows.length,
    importable: conflicts.accepted.length,
    issues: [...analysis.issues, ...conflicts.issues],
    records: conflicts.accepted.slice(0, 100),
    truncated: conflicts.accepted.length > 100,
  };
}

export async function importData(input: {
  file: File;
  type: ImportType;
  siteId?: string;
  changedBy: string;
  workCategoryRequirements?: Record<string, {
    requiresTraining: boolean;
    requiresSpecialPermission: boolean;
    requiresWorkPermit: boolean;
  }>;
}) {
  validateFile(input.file);
  if (input.type === "allowedAreas" && !input.siteId) throw new Error("Selecciona el centro al que pertenecen las áreas.");
  const rows = parseWorkbook(await input.file.arrayBuffer());
  const analysis = selectRecords(input.type, rows);
  const conflicts = await DataImportEntity.previewRecords({ type: input.type, records: analysis.valid, siteId: input.siteId });
  const fileIssues = [...analysis.issues, ...conflicts.issues];
  if (!conflicts.accepted.length) {
    return { imported: 0, skipped: fileIssues.length, createdDependencies: 0, issues: fileIssues };
  }
  const result = await DataImportEntity.importRecords({
    type: input.type,
    records: conflicts.accepted,
    siteId: input.siteId,
    changedBy: input.changedBy,
    workCategoryRequirements: input.workCategoryRequirements,
  });
  return {
    ...result,
    skipped: result.skipped + fileIssues.length,
    issues: [...fileIssues, ...result.issues],
  };
}

function validateFile(file: File) {
  const extension = file.name.toLowerCase().split(".").at(-1);
  if (!file.size || file.size > MAX_FILE_SIZE) throw new Error("El archivo está vacío o supera el límite de 10 MB.");
  if (!extension || !["xlsx", "xls", "csv"].includes(extension)) {
    throw new Error("Selecciona un archivo Excel (.xlsx o .xls) o CSV.");
  }
}

export function isImportType(value: FormDataEntryValue | null): value is ImportType {
  return value === "companies" || value === "workers" || value === "workCategories" || value === "allowedAreas";
}
