import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type {
  DocumentStatus,
  DocumentType,
  PlannedAccessStatus,
  UserRole,
} from "./enums";

// ───── Enums ────────────────────────────────────────

function makeId() {
  return crypto.randomUUID();
}

const timestampDefault = sql`(
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
)`;

// ───── Sites ─────────────────────────────────────────

export const sites = sqliteTable("sites", {
  id: text("id").primaryKey().$default(makeId),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  address: text("address"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
});

// ───── Departments ───────────────────────────────────

export const departments = sqliteTable("departments", {
  id: text("id").primaryKey().$default(makeId),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
});

// ───── Users ─────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$default(makeId),
  fullName: text("full_name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").$type<UserRole>().default("ACCESS_OPERATOR"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  isTrashed: integer("is_trashed", { mode: "boolean" }).default(false),
  siteId: text("site_id")
    .notNull()
    .references(() => sites.id),
  departmentId: text("department_id")
    .notNull()
    .references(() => departments.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
});

// ───── Companies ─────────────────────────────────────

export const companies = sqliteTable("companies", {
  id: text("id").primaryKey().$default(makeId),
  name: text("name").notNull(),
  cif: text("cif").notNull().default(""),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  slug: text("slug").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
});

// ───── Work Categories ───────────────────────────────

export const workCategories = sqliteTable("work_categories", {
  id: text("id").primaryKey().$default(makeId),
  name: text("name").notNull(),
  description: text("description"),
  requiresSpecialPermission: integer("requires_special_permission", {
    mode: "boolean",
  }).default(false),
  requiresTraining: integer("requires_training", { mode: "boolean" }).default(
    false,
  ),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
});

// ───── External Workers ──────────────────────────────

export const externalWorkers = sqliteTable("external_workers", {
  id: text("id").primaryKey().$default(makeId),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  secondLastName: text("second_last_name"),
  phoneNumber: text("phone_number"),
  legalId: text("legal_id").notNull().unique(),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id),
  workCategoryId: text("work_category_id")
    .notNull()
    .references(() => workCategories.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
});

// ───── Worker Documents ──────────────────────────────

export const workerDocuments = sqliteTable("worker_documents", {
  id: text("id").primaryKey().$default(makeId),
  documentType: text("document_type")
    .$type<DocumentType>()
    .notNull(),
  status: text("status").$type<DocumentStatus>().default("VALIDATED"),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  expiryDate: integer("expiry_date", { mode: "timestamp_ms" }).notNull(),
  notes: text("notes"),
  externalWorkerId: text("external_worker_id")
    .notNull()
    .references(() => externalWorkers.id, {
      onDelete: "cascade",
    }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
});

// ───── Audit Logs ────────────────────────────────────

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey().$default(makeId),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  changedBy: text("changed_by").notNull(),
  summary: text("summary").notNull(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
});

// ───── Access Log Vehicles ───────────────────────────

export const accessLogVehicles = sqliteTable("access_log_vehicles", {
  id: text("id").primaryKey().$default(makeId),
  typeSnapshot: text("type_snapshot").notNull(),
  brandSnapshot: text("brand_snapshot"),
  modelSnapshot: text("model_snapshot"),
  plateSnapshot: text("plate_snapshot").notNull(),
});

// ───── Access Logs ───────────────────────────────────

export const accessLogs = sqliteTable("access_logs", {
  id: text("id").primaryKey().$default(makeId),
  entryTimestamp: integer("entry_timestamp", { mode: "timestamp_ms" }).notNull(),
  entrySignatureEnvelope: text("entry_signature_envelope", {
    mode: "json",
  })
    .$type<Record<string, unknown>>()
    .notNull(),
  exitTimestamp: integer("exit_timestamp", { mode: "timestamp_ms" }),
  exitSignatureEnvelope: text("exit_signature_envelope", { mode: "json" })
    .$type<Record<string, unknown>>(),
  companyNameSnapshot: text("company_name_snapshot").notNull(),
  firstNameSnapshot: text("first_name_snapshot").notNull(),
  middleNameSnapshot: text("middle_name_snapshot"),
  lastNameSnapshot: text("last_name_snapshot").notNull(),
  secondLastNameSnapshot: text("second_last_name_snapshot"),
  phoneNumber: text("phone_number"),
  legalIdSnapshot: text("legal_id_snapshot").notNull(),
  withVehicle: integer("with_vehicle", { mode: "boolean" }).default(false),
  visitReason: text("visit_reason").notNull(),
  siteId: text("site_id")
    .notNull()
    .references(() => sites.id),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id),
  exitRecordedById: text("exit_recorded_by_id").references(() => users.id),
  vehicleAccessLogId: text("vehicle_access_log_id").references(
    () => accessLogVehicles.id,
  ),
  plannedAccessId: text("planned_access_id").references(() => plannedAccesses.id),
  plannedAccessPersonId: text("planned_access_person_id").references(
    () => plannedAccessPersons.id,
  ),
  externalWorkerId: text("external_worker_id").references(
    () => externalWorkers.id,
  ),
});

// ───── Planned Accesses ──────────────────────────────

export const plannedAccesses = sqliteTable("planned_accesses", {
  id: text("id").primaryKey().$default(makeId),
  expectedStartDatetime: integer("expected_start_datetime", { mode: "timestamp_ms" }).notNull(),
  expectedEndDatetime: integer("expected_end_datetime", { mode: "timestamp_ms" }),
  status: text("status")
    .$type<PlannedAccessStatus>()
    .default("PENDING_APPROVAL"),
  companySnapshot: text("company_snapshot").notNull(),
  visitReason: text("visit_reason").notNull(),
  approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
  approvedById: text("approved_by_id")
    .notNull()
    .references(() => users.id),
  requestedById: text("requested_by_id")
    .notNull()
    .references(() => users.id),
  siteId: text("site_id")
    .notNull()
    .references(() => sites.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
});

// ───── Planned Access Persons ────────────────────────

export const plannedAccessPersons = sqliteTable("planned_access_persons", {
  id: text("id").primaryKey().$default(makeId),
  firstNameSnapshot: text("first_name_snapshot").notNull(),
  middleNameSnapshot: text("middle_name_snapshot"),
  lastNameSnapshot: text("last_name_snapshot").notNull(),
  secondLastNameSnapshot: text("second_last_name_snapshot"),
  phoneNumber: text("phone_number"),
  legalIdSnapshot: text("legal_id_snapshot").notNull(),
  workCategoryId: text("work_category_id").references(() => workCategories.id),
  plannedAccessId: text("planned_access_id")
    .notNull()
    .references(() => plannedAccesses.id),
  externalWorkerId: text("external_worker_id").references(
    () => externalWorkers.id,
  ),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(timestampDefault),
});

// ───── Convenience Types ─────────────────────────────

export type Site = typeof sites.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type WorkCategory = typeof workCategories.$inferSelect;
export type ExternalWorker = typeof externalWorkers.$inferSelect;
export type WorkerDocument = typeof workerDocuments.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AccessLogVehicle = typeof accessLogVehicles.$inferSelect;
export type AccessLog = typeof accessLogs.$inferSelect;
export type PlannedAccess = typeof plannedAccesses.$inferSelect;
export type PlannedAccessPerson = typeof plannedAccessPersons.$inferSelect;

// ───── Relations ─────────────────────────────────────

export const sitesRelations = relations(sites, ({ many }) => ({
  users: many(users),
  accessLogs: many(accessLogs),
  plannedAccesses: many(plannedAccesses),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  site: one(sites, { fields: [users.siteId], references: [sites.id] }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  createdAccesLogs: many(accessLogs, { relationName: "createdBy" }),
  accessLogsMarkedExit: many(accessLogs, { relationName: "exitRecordedBy" }),
  requestedPlannedAccesses: many(plannedAccesses, {
    relationName: "requestedBy",
  }),
  validatedPlannedAccess: many(plannedAccesses, {
    relationName: "approvedBy",
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  externalWorkers: many(externalWorkers),
}));

export const workCategoriesRelations = relations(workCategories, ({ many }) => ({
  externalWorkers: many(externalWorkers),
  plannedAccessPersons: many(plannedAccessPersons),
}));

export const externalWorkersRelations = relations(
  externalWorkers,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [externalWorkers.companyId],
      references: [companies.id],
    }),
    workCategory: one(workCategories, {
      fields: [externalWorkers.workCategoryId],
      references: [workCategories.id],
    }),
    accessLogs: many(accessLogs),
    plannedAccessPersons: many(plannedAccessPersons),
    documents: many(workerDocuments),
  }),
);

export const workerDocumentsRelations = relations(
  workerDocuments,
  ({ one }) => ({
    externalWorker: one(externalWorkers, {
      fields: [workerDocuments.externalWorkerId],
      references: [externalWorkers.id],
    }),
  }),
);

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  site: one(sites, { fields: [accessLogs.siteId], references: [sites.id] }),
  createdBy: one(users, {
    fields: [accessLogs.createdById],
    references: [users.id],
    relationName: "createdBy",
  }),
  exitRecordedBy: one(users, {
    fields: [accessLogs.exitRecordedById],
    references: [users.id],
    relationName: "exitRecordedBy",
  }),
  vehicleAccessLog: one(accessLogVehicles, {
    fields: [accessLogs.vehicleAccessLogId],
    references: [accessLogVehicles.id],
  }),
  plannedAccess: one(plannedAccesses, {
    fields: [accessLogs.plannedAccessId],
    references: [plannedAccesses.id],
  }),
  plannedAccessPerson: one(plannedAccessPersons, {
    fields: [accessLogs.plannedAccessPersonId],
    references: [plannedAccessPersons.id],
  }),
  externalWorker: one(externalWorkers, {
    fields: [accessLogs.externalWorkerId],
    references: [externalWorkers.id],
  }),
}));

export const plannedAccessesRelations = relations(
  plannedAccesses,
  ({ one, many }) => ({
    site: one(sites, {
      fields: [plannedAccesses.siteId],
      references: [sites.id],
    }),
    requestedBy: one(users, {
      fields: [plannedAccesses.requestedById],
      references: [users.id],
      relationName: "requestedBy",
    }),
    approvedBy: one(users, {
      fields: [plannedAccesses.approvedById],
      references: [users.id],
      relationName: "approvedBy",
    }),
    plannedAccessPersons: many(plannedAccessPersons),
    accessLogs: many(accessLogs),
  }),
);

export const plannedAccessPersonsRelations = relations(
  plannedAccessPersons,
  ({ one, many }) => ({
    plannedAccess: one(plannedAccesses, {
      fields: [plannedAccessPersons.plannedAccessId],
      references: [plannedAccesses.id],
    }),
    externalWorker: one(externalWorkers, {
      fields: [plannedAccessPersons.externalWorkerId],
      references: [externalWorkers.id],
    }),
    workCategory: one(workCategories, {
      fields: [plannedAccessPersons.workCategoryId],
      references: [workCategories.id],
    }),
    accessLogs: many(accessLogs),
  }),
);
