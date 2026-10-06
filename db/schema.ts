import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type {
  DocumentExpiryBasis,
  DocumentRecordType,
  DocumentStatus,
  DocumentType,
  PlannedAccessStatus,
  UserRole,
  WorkPermitStatus,
  AccessDecision,
  WorkDecision,
  AccessLogExitMethod,
} from "./enums";

// ───── Enums ────────────────────────────────────────

function makeId() {
  return crypto.randomUUID();
}

// ───── Sites ─────────────────────────────────────────

export const sites = pgTable("sites", {
  id: text("id").primaryKey().$default(makeId),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  address: text("address"),
  riskInformation: text("risk_information"),
  riskInformationVersion: integer("risk_information_version").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ───── Departments ───────────────────────────────────

export const departments = pgTable("departments", {
  id: text("id").primaryKey().$default(makeId),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ───── Users ─────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey().$default(makeId),
  fullName: text("full_name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").$type<UserRole>().default("ACCESS_OPERATOR"),
  isActive: boolean("is_active").default(true),
  isTrashed: boolean("is_trashed").default(false),
  siteId: text("site_id")
    .notNull()
    .references(() => sites.id),
  departmentId: text("department_id")
    .notNull()
    .references(() => departments.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ───── Companies ─────────────────────────────────────

export const companies = pgTable("companies", {
  id: text("id").primaryKey().$default(makeId),
  name: text("name").notNull(),
  cif: text("cif").notNull().default(""),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ───── Work Categories ───────────────────────────────

export const workCategories = pgTable("work_categories", {
  id: text("id").primaryKey().$default(makeId),
  name: text("name").notNull(),
  description: text("description"),
  riskInformation: text("risk_information"),
  requiresSpecialPermission: boolean("requires_special_permission").default(false),
  requiresTraining: boolean("requires_training").default(
    false,
  ),
  requiresWorkPermit: boolean("requires_work_permit").default(
    false,
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ───── Allowed Areas ──────────────────────────────────

export const allowedAreas = pgTable("allowed_areas", {
  id: text("id").primaryKey().$default(makeId),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ───── External Workers ──────────────────────────────

export const externalWorkers = pgTable("external_workers", {
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ───── Worker Documents ──────────────────────────────

export const workerDocuments = pgTable("worker_documents", {
  id: text("id").primaryKey().$default(makeId),
  documentType: text("document_type")
    .$type<DocumentType>()
    .notNull(),
  recordType: text("record_type")
    .$type<DocumentRecordType>()
    .notNull()
    .default("TRAINING_EVIDENCE"),
  status: text("status")
    .$type<DocumentStatus>()
    .notNull()
    .default("PENDING_REVIEW"),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  contentHash: text("content_hash"),
  completedAt: timestamp("completed_at"),
  issuedAt: timestamp("issued_at"),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("expiry_date"),
  refresherDueAt: timestamp("refresher_due_at"),
  reviewDueAt: timestamp("review_due_at"),
  lastPerformedAt: timestamp("last_performed_at"),
  expiryBasis: text("expiry_basis")
    .$type<DocumentExpiryBasis>()
    .notNull()
    .default("NOT_APPLICABLE"),
  legalSource: text("legal_source"),
  jurisdiction: text("jurisdiction"),
  sector: text("sector"),
  siteId: text("site_id").references(() => sites.id),
  workCategoryId: text("work_category_id").references(() => workCategories.id),
  taskScope: text("task_scope"),
  riskScopes: jsonb("risk_scopes").$type<string[]>(),
  equipmentTypes: jsonb("equipment_types").$type<string[]>(),
  procedureVersion: text("procedure_version"),
  issuer: text("issuer"),
  employerAuthorizer: text("employer_authorizer"),
  reviewedById: text("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewReason: text("review_reason"),
  supersedesDocumentId: text("supersedes_document_id"),
  notes: text("notes"),
  externalWorkerId: text("external_worker_id")
    .notNull()
    .references(() => externalWorkers.id, {
      onDelete: "cascade",
    }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const documentReviews = pgTable("document_reviews", {
  id: text("id").primaryKey().$default(makeId),
  documentId: text("document_id")
    .notNull()
    .references(() => workerDocuments.id),
  decision: text("decision").$type<"VALIDATED" | "REJECTED">().notNull(),
  reason: text("reason").notNull(),
  evidenceSnapshot: jsonb("evidence_snapshot")
    .$type<Record<string, unknown>>()
    .notNull(),
  reviewedById: text("reviewed_by_id")
    .notNull()
    .references(() => users.id),
  reviewedAt: timestamp("reviewed_at").notNull().defaultNow(),
});

// ───── Audit Logs ────────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$default(makeId),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  changedBy: text("changed_by").notNull(),
  summary: text("summary").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ───── Application Settings ──────────────────────────

export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey(),
  earlyArrivalToleranceMinutes: integer("early_arrival_tolerance_minutes")
    .notNull()
    .default(60),
  holderLegalName: text("holder_legal_name"),
  holderTaxId: text("holder_tax_id"),
  holderFiscalAddress: text("holder_fiscal_address"),
  updatedById: text("updated_by_id").references(() => users.id),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow(),
});

// ───── Access Log Vehicles ───────────────────────────

export const accessLogVehicles = pgTable("access_log_vehicles", {
  id: text("id").primaryKey().$default(makeId),
  typeSnapshot: text("type_snapshot").notNull(),
  brandSnapshot: text("brand_snapshot"),
  modelSnapshot: text("model_snapshot"),
  plateSnapshot: text("plate_snapshot").notNull(),
});

// ───── Access Logs ───────────────────────────────────

export const accessLogs = pgTable("access_logs", {
  id: text("id").primaryKey().$default(makeId),
  entryTimestamp: timestamp("entry_timestamp").notNull(),
  entrySignatureEnvelope: jsonb("entry_signature_envelope")
    .$type<Record<string, unknown>>()
    .notNull(),
  riskAcknowledgedAt: timestamp("risk_acknowledged_at"),
  riskAcknowledgementSnapshot: jsonb("risk_acknowledgement_snapshot")
    .$type<Record<string, unknown>>(),
  exitTimestamp: timestamp("exit_timestamp"),
  exitSignatureEnvelope: jsonb("exit_signature_envelope")
    .$type<Record<string, unknown>>(),
  exitSignatureRequestedAt: timestamp("exit_signature_requested_at"),
  exitSignatureRequestedById: text("exit_signature_requested_by_id").references(
    () => users.id,
  ),
  exitClosureMethod: text("exit_closure_method").$type<AccessLogExitMethod>(),
  companyNameSnapshot: text("company_name_snapshot").notNull(),
  companyId: text("company_id").references(() => companies.id),
  firstNameSnapshot: text("first_name_snapshot").notNull(),
  middleNameSnapshot: text("middle_name_snapshot"),
  lastNameSnapshot: text("last_name_snapshot").notNull(),
  secondLastNameSnapshot: text("second_last_name_snapshot"),
  phoneNumber: text("phone_number"),
  legalIdSnapshot: text("legal_id_snapshot").notNull(),
  allowedAreaSnapshot: text("allowed_area_snapshot").notNull().default("No especificado"),
  allowedAreaId: text("allowed_area_id").references(() => allowedAreas.id),
  approvedBySnapshot: text("approved_by_snapshot").notNull().default("No especificado"),
  withVehicle: boolean("with_vehicle").default(false),
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
  workPermitId: text("work_permit_id").references(() => workPermits.id),
});

// ───── Planned Accesses ──────────────────────────────

export const plannedAccesses = pgTable("planned_accesses", {
  id: text("id").primaryKey().$default(makeId),
  expectedStartDatetime: timestamp("expected_start_datetime").notNull(),
  expectedEndDatetime: timestamp("expected_end_datetime"),
  status: text("status")
    .$type<PlannedAccessStatus>()
    .default("PENDING_APPROVAL"),
  companySnapshot: text("company_snapshot").notNull(),
  companyId: text("company_id").references(() => companies.id),
  visitReason: text("visit_reason").notNull(),
  approvedAt: timestamp("approved_at"),
  approvedById: text("approved_by_id")
    .references(() => users.id),
  decisionReason: text("decision_reason"),
  decisionAt: timestamp("decision_at"),
  decisionById: text("decision_by_id").references(() => users.id),
  requestedById: text("requested_by_id")
    .notNull()
    .references(() => users.id),
  departmentId: text("department_id")
    .notNull()
    .references(() => departments.id),
  siteId: text("site_id")
    .notNull()
    .references(() => sites.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ───── Planned Access Persons ────────────────────────

export const plannedAccessPersons = pgTable("planned_access_persons", {
  id: text("id").primaryKey().$default(makeId),
  firstNameSnapshot: text("first_name_snapshot").notNull(),
  middleNameSnapshot: text("middle_name_snapshot"),
  lastNameSnapshot: text("last_name_snapshot").notNull(),
  secondLastNameSnapshot: text("second_last_name_snapshot"),
  phoneNumber: text("phone_number"),
  legalIdSnapshot: text("legal_id_snapshot").notNull(),
  workCategoryId: text("work_category_id").references(() => workCategories.id),
  allowedAreaSnapshot: text("allowed_area_snapshot").notNull().default("No especificada"),
  allowedAreaId: text("allowed_area_id").references(() => allowedAreas.id),
  plannedAccessId: text("planned_access_id")
    .notNull()
    .references(() => plannedAccesses.id),
  externalWorkerId: text("external_worker_id").references(
    () => externalWorkers.id,
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ───── Work Permit Activities ─────────────────────────

export const workPermitActivities = pgTable("work_permit_activities", {
  id: text("id").primaryKey().$default(makeId),
  plannedAccessId: text("planned_access_id")
    .notNull()
    .references(() => plannedAccesses.id),
  siteId: text("site_id").notNull().references(() => sites.id),
  companyId: text("company_id").notNull().references(() => companies.id),
  companySnapshot: text("company_snapshot").notNull(),
  taskDescription: text("task_description").notNull(),
  workAreaSnapshot: text("work_area_snapshot").notNull(),
  expectedStartDatetime: timestamp("expected_start_datetime").notNull(),
  expectedEndDatetime: timestamp("expected_end_datetime"),
  riskItems: jsonb("risk_items")
    .$type<Array<{ title: string; measures: string }>>()
    .notNull(),
  toolsAndEquipment: text("tools_and_equipment").notNull(),
  personalProtectiveEquipment: text("personal_protective_equipment").notNull(),
  checklist: jsonb("checklist")
    .$type<{
      toolsAdequate: boolean;
      procedureKnown: boolean;
      trainingProvided: boolean;
      areaOrderly: boolean;
      ppeAdequate: boolean;
    }>()
    .notNull(),
  incidents: text("incidents"),
  facilityRiskSnapshot: text("facility_risk_snapshot").notNull(),
  facilityRiskVersion: integer("facility_risk_version").notNull().default(0),
  createdById: text("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ───── Work Permits ────────────────────────────────────

export const workPermits = pgTable("work_permits", {
  id: text("id").primaryKey().$default(makeId),
  activityId: text("activity_id").notNull().references(() => workPermitActivities.id),
  plannedAccessPersonId: text("planned_access_person_id")
    .notNull()
    .references(() => plannedAccessPersons.id),
  externalWorkerId: text("external_worker_id").references(() => externalWorkers.id),
  firstNameSnapshot: text("first_name_snapshot").notNull(),
  lastNameSnapshot: text("last_name_snapshot").notNull(),
  legalIdSnapshot: text("legal_id_snapshot").notNull(),
  workCategoryId: text("work_category_id").notNull().references(() => workCategories.id),
  workCategoryRiskSnapshot: text("work_category_risk_snapshot"),
  restrictions: text("restrictions"),
  status: text("status").$type<WorkPermitStatus>().notNull().default("DRAFT"),
  approvedById: text("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  approvedSnapshot: jsonb("approved_snapshot").$type<Record<string, unknown>>(),
  createdById: text("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("work_permits_activity_person_idx").on(table.activityId, table.plannedAccessPersonId),
]);

export const plannedAccessPersonDecisions = pgTable("planned_access_person_decisions", {
  id: text("id").primaryKey().$default(makeId),
  plannedAccessPersonId: text("planned_access_person_id")
    .notNull()
    .references(() => plannedAccessPersons.id),
  workPermitId: text("work_permit_id").references(() => workPermits.id),
  accessDecision: text("access_decision").$type<AccessDecision>().notNull().default("PENDING"),
  workDecision: text("work_decision").$type<WorkDecision>().notNull().default("PENDING"),
  decisionReason: text("decision_reason"),
  decidedById: text("decided_by_id").references(() => users.id),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("planned_access_person_decisions_person_idx").on(table.plannedAccessPersonId),
]);

export const workPermitSignatures = pgTable("work_permit_signatures", {
  id: text("id").primaryKey().$default(makeId),
  workPermitId: text("work_permit_id").notNull().references(() => workPermits.id),
  signerType: text("signer_type").notNull(),
  signerName: text("signer_name").notNull(),
  signerLegalId: text("signer_legal_id"),
  signatureEnvelope: jsonb("signature_envelope")
    .$type<Record<string, unknown>>()
    .notNull(),
  capturedById: text("captured_by_id").notNull().references(() => users.id),
  signedAt: timestamp("signed_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("work_permit_signatures_type_idx").on(table.workPermitId, table.signerType),
]);

// ───── Convenience Types ─────────────────────────────

export type Site = typeof sites.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type WorkCategory = typeof workCategories.$inferSelect;
export type AllowedArea = typeof allowedAreas.$inferSelect;
export type ExternalWorker = typeof externalWorkers.$inferSelect;
export type WorkerDocument = typeof workerDocuments.$inferSelect;
export type DocumentReview = typeof documentReviews.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AppSettings = typeof appSettings.$inferSelect;
export type AccessLogVehicle = typeof accessLogVehicles.$inferSelect;
export type AccessLog = typeof accessLogs.$inferSelect;
export type PlannedAccess = typeof plannedAccesses.$inferSelect;
export type PlannedAccessPerson = typeof plannedAccessPersons.$inferSelect;
export type WorkPermitActivity = typeof workPermitActivities.$inferSelect;
export type WorkPermit = typeof workPermits.$inferSelect;
export type PlannedAccessPersonDecision = typeof plannedAccessPersonDecisions.$inferSelect;
export type WorkPermitSignature = typeof workPermitSignatures.$inferSelect;

// ───── Relations ─────────────────────────────────────

export const sitesRelations = relations(sites, ({ many }) => ({
  users: many(users),
  accessLogs: many(accessLogs),
  plannedAccesses: many(plannedAccesses),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  plannedAccesses: many(plannedAccesses),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  site: one(sites, { fields: [users.siteId], references: [sites.id] }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  createdAccesLogs: many(accessLogs, { relationName: "createdBy" }),
  accessLogsMarkedExit: many(accessLogs, { relationName: "exitRecordedBy" }),
  accessLogsSignatureRequested: many(accessLogs, {
    relationName: "exitSignatureRequestedBy",
  }),
  requestedPlannedAccesses: many(plannedAccesses, {
    relationName: "requestedBy",
  }),
  validatedPlannedAccess: many(plannedAccesses, {
    relationName: "approvedBy",
  }),
  decidedPlannedAccesses: many(plannedAccesses, {
    relationName: "decisionBy",
  }),
  documentReviews: many(documentReviews),
  updatedAppSettings: many(appSettings),
}));

export const appSettingsRelations = relations(appSettings, ({ one }) => ({
  updatedBy: one(users, {
    fields: [appSettings.updatedById],
    references: [users.id],
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  externalWorkers: many(externalWorkers),
}));

export const workCategoriesRelations = relations(workCategories, ({ many }) => ({
  externalWorkers: many(externalWorkers),
  plannedAccessPersons: many(plannedAccessPersons),
  workPermits: many(workPermits),
}));

export const allowedAreasRelations = relations(allowedAreas, ({ many }) => ({
  plannedAccessPersons: many(plannedAccessPersons),
  accessLogs: many(accessLogs),
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
  ({ one, many }) => ({
    externalWorker: one(externalWorkers, {
      fields: [workerDocuments.externalWorkerId],
      references: [externalWorkers.id],
    }),
    reviews: many(documentReviews),
  }),
);

export const documentReviewsRelations = relations(documentReviews, ({ one }) => ({
  document: one(workerDocuments, {
    fields: [documentReviews.documentId],
    references: [workerDocuments.id],
  }),
  reviewedBy: one(users, {
    fields: [documentReviews.reviewedById],
    references: [users.id],
  }),
}));

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
  exitSignatureRequestedBy: one(users, {
    fields: [accessLogs.exitSignatureRequestedById],
    references: [users.id],
    relationName: "exitSignatureRequestedBy",
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
  allowedArea: one(allowedAreas, {
    fields: [accessLogs.allowedAreaId],
    references: [allowedAreas.id],
  }),
  externalWorker: one(externalWorkers, {
    fields: [accessLogs.externalWorkerId],
    references: [externalWorkers.id],
  }),
  workPermit: one(workPermits, {
    fields: [accessLogs.workPermitId],
    references: [workPermits.id],
  }),
}));

export const plannedAccessesRelations = relations(
  plannedAccesses,
  ({ one, many }) => ({
    site: one(sites, {
      fields: [plannedAccesses.siteId],
      references: [sites.id],
    }),
    company: one(companies, {
      fields: [plannedAccesses.companyId],
      references: [companies.id],
    }),
    department: one(departments, {
      fields: [plannedAccesses.departmentId],
      references: [departments.id],
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
    decisionBy: one(users, {
      fields: [plannedAccesses.decisionById],
      references: [users.id],
      relationName: "decisionBy",
    }),
    plannedAccessPersons: many(plannedAccessPersons),
    accessLogs: many(accessLogs),
    workPermitActivities: many(workPermitActivities),
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
    allowedArea: one(allowedAreas, {
      fields: [plannedAccessPersons.allowedAreaId],
      references: [allowedAreas.id],
    }),
    accessLogs: many(accessLogs),
    workPermits: many(workPermits),
    decision: one(plannedAccessPersonDecisions, {
      fields: [plannedAccessPersons.id],
      references: [plannedAccessPersonDecisions.plannedAccessPersonId],
    }),
  }),
);

export const workPermitActivitiesRelations = relations(
  workPermitActivities,
  ({ one, many }) => ({
    plannedAccess: one(plannedAccesses, {
      fields: [workPermitActivities.plannedAccessId],
      references: [plannedAccesses.id],
    }),
    site: one(sites, { fields: [workPermitActivities.siteId], references: [sites.id] }),
    company: one(companies, { fields: [workPermitActivities.companyId], references: [companies.id] }),
    createdBy: one(users, { fields: [workPermitActivities.createdById], references: [users.id] }),
    workPermits: many(workPermits),
  }),
);

export const workPermitsRelations = relations(workPermits, ({ one, many }) => ({
  activity: one(workPermitActivities, {
    fields: [workPermits.activityId],
    references: [workPermitActivities.id],
  }),
  plannedAccessPerson: one(plannedAccessPersons, {
    fields: [workPermits.plannedAccessPersonId],
    references: [plannedAccessPersons.id],
  }),
  externalWorker: one(externalWorkers, {
    fields: [workPermits.externalWorkerId],
    references: [externalWorkers.id],
  }),
  workCategory: one(workCategories, {
    fields: [workPermits.workCategoryId],
    references: [workCategories.id],
  }),
  approvedBy: one(users, { fields: [workPermits.approvedById], references: [users.id] }),
  createdBy: one(users, { fields: [workPermits.createdById], references: [users.id] }),
  signatures: many(workPermitSignatures),
  accessLogs: many(accessLogs),
}));

export const plannedAccessPersonDecisionsRelations = relations(
  plannedAccessPersonDecisions,
  ({ one }) => ({
    plannedAccessPerson: one(plannedAccessPersons, {
      fields: [plannedAccessPersonDecisions.plannedAccessPersonId],
      references: [plannedAccessPersons.id],
    }),
    workPermit: one(workPermits, {
      fields: [plannedAccessPersonDecisions.workPermitId],
      references: [workPermits.id],
    }),
    decidedBy: one(users, {
      fields: [plannedAccessPersonDecisions.decidedById],
      references: [users.id],
    }),
  }),
);

export const workPermitSignaturesRelations = relations(workPermitSignatures, ({ one }) => ({
  workPermit: one(workPermits, {
    fields: [workPermitSignatures.workPermitId],
    references: [workPermits.id],
  }),
  capturedBy: one(users, {
    fields: [workPermitSignatures.capturedById],
    references: [users.id],
  }),
}));
