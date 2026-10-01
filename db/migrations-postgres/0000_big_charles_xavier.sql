CREATE TABLE "access_log_vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"type_snapshot" text NOT NULL,
	"brand_snapshot" text,
	"model_snapshot" text,
	"plate_snapshot" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "access_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_timestamp" timestamp NOT NULL,
	"entry_signature_envelope" jsonb NOT NULL,
	"risk_acknowledged_at" timestamp,
	"risk_acknowledgement_snapshot" jsonb,
	"exit_timestamp" timestamp,
	"exit_signature_envelope" jsonb,
	"company_name_snapshot" text NOT NULL,
	"company_id" text,
	"first_name_snapshot" text NOT NULL,
	"middle_name_snapshot" text,
	"last_name_snapshot" text NOT NULL,
	"second_last_name_snapshot" text,
	"phone_number" text,
	"legal_id_snapshot" text NOT NULL,
	"allowed_area_snapshot" text DEFAULT 'No especificado' NOT NULL,
	"allowed_area_id" text,
	"approved_by_snapshot" text DEFAULT 'No especificado' NOT NULL,
	"with_vehicle" boolean DEFAULT false,
	"visit_reason" text NOT NULL,
	"site_id" text NOT NULL,
	"created_by_id" text NOT NULL,
	"exit_recorded_by_id" text,
	"vehicle_access_log_id" text,
	"planned_access_id" text,
	"planned_access_person_id" text,
	"external_worker_id" text,
	"work_permit_id" text
);
--> statement-breakpoint
CREATE TABLE "allowed_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "allowed_areas_name_unique" UNIQUE("name"),
	CONSTRAINT "allowed_areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"early_arrival_tolerance_minutes" integer DEFAULT 60 NOT NULL,
	"holder_legal_name" text,
	"holder_tax_id" text,
	"holder_fiscal_address" text,
	"updated_by_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"changed_by" text NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cif" text DEFAULT '' NOT NULL,
	"address" text,
	"phone" text,
	"email" text,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "document_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"decision" text NOT NULL,
	"reason" text NOT NULL,
	"evidence_snapshot" jsonb NOT NULL,
	"reviewed_by_id" text NOT NULL,
	"reviewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_workers" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"second_last_name" text,
	"phone_number" text,
	"legal_id" text NOT NULL,
	"company_id" text NOT NULL,
	"work_category_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "external_workers_legal_id_unique" UNIQUE("legal_id")
);
--> statement-breakpoint
CREATE TABLE "planned_access_person_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"planned_access_person_id" text NOT NULL,
	"work_permit_id" text,
	"access_decision" text DEFAULT 'PENDING' NOT NULL,
	"work_decision" text DEFAULT 'PENDING' NOT NULL,
	"decision_reason" text,
	"decided_by_id" text,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planned_access_persons" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name_snapshot" text NOT NULL,
	"middle_name_snapshot" text,
	"last_name_snapshot" text NOT NULL,
	"second_last_name_snapshot" text,
	"phone_number" text,
	"legal_id_snapshot" text NOT NULL,
	"work_category_id" text,
	"allowed_area_snapshot" text DEFAULT 'No especificada' NOT NULL,
	"allowed_area_id" text,
	"planned_access_id" text NOT NULL,
	"external_worker_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planned_accesses" (
	"id" text PRIMARY KEY NOT NULL,
	"expected_start_datetime" timestamp NOT NULL,
	"expected_end_datetime" timestamp,
	"status" text DEFAULT 'PENDING_APPROVAL',
	"company_snapshot" text NOT NULL,
	"company_id" text,
	"visit_reason" text NOT NULL,
	"approved_at" timestamp,
	"approved_by_id" text,
	"decision_reason" text,
	"decision_at" timestamp,
	"decision_by_id" text,
	"requested_by_id" text NOT NULL,
	"department_id" text NOT NULL,
	"site_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"address" text,
	"risk_information" text,
	"risk_information_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sites_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'ACCESS_OPERATOR',
	"is_active" boolean DEFAULT true,
	"is_trashed" boolean DEFAULT false,
	"site_id" text NOT NULL,
	"department_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "work_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"risk_information" text,
	"requires_special_permission" boolean DEFAULT false,
	"requires_training" boolean DEFAULT false,
	"requires_work_permit" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_permit_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"planned_access_id" text NOT NULL,
	"site_id" text NOT NULL,
	"company_id" text NOT NULL,
	"company_snapshot" text NOT NULL,
	"task_description" text NOT NULL,
	"work_area_snapshot" text NOT NULL,
	"expected_start_datetime" timestamp NOT NULL,
	"expected_end_datetime" timestamp,
	"risk_items" jsonb NOT NULL,
	"tools_and_equipment" text NOT NULL,
	"personal_protective_equipment" text NOT NULL,
	"checklist" jsonb NOT NULL,
	"incidents" text,
	"facility_risk_snapshot" text NOT NULL,
	"facility_risk_version" integer DEFAULT 0 NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_permit_signatures" (
	"id" text PRIMARY KEY NOT NULL,
	"work_permit_id" text NOT NULL,
	"signer_type" text NOT NULL,
	"signer_name" text NOT NULL,
	"signer_legal_id" text,
	"signature_envelope" jsonb NOT NULL,
	"captured_by_id" text NOT NULL,
	"signed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_permits" (
	"id" text PRIMARY KEY NOT NULL,
	"activity_id" text NOT NULL,
	"planned_access_person_id" text NOT NULL,
	"external_worker_id" text,
	"first_name_snapshot" text NOT NULL,
	"last_name_snapshot" text NOT NULL,
	"legal_id_snapshot" text NOT NULL,
	"work_category_id" text NOT NULL,
	"work_category_risk_snapshot" text,
	"restrictions" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"approved_by_id" text,
	"approved_at" timestamp,
	"approved_snapshot" jsonb,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"document_type" text NOT NULL,
	"record_type" text DEFAULT 'TRAINING_EVIDENCE' NOT NULL,
	"status" text DEFAULT 'PENDING_REVIEW' NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"content_hash" text,
	"completed_at" timestamp,
	"issued_at" timestamp,
	"valid_from" timestamp,
	"expiry_date" timestamp,
	"refresher_due_at" timestamp,
	"review_due_at" timestamp,
	"last_performed_at" timestamp,
	"expiry_basis" text DEFAULT 'NOT_APPLICABLE' NOT NULL,
	"legal_source" text,
	"jurisdiction" text,
	"sector" text,
	"site_id" text,
	"work_category_id" text,
	"task_scope" text,
	"risk_scopes" jsonb,
	"equipment_types" jsonb,
	"procedure_version" text,
	"issuer" text,
	"employer_authorizer" text,
	"reviewed_by_id" text,
	"reviewed_at" timestamp,
	"review_reason" text,
	"supersedes_document_id" text,
	"notes" text,
	"external_worker_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_allowed_area_id_allowed_areas_id_fk" FOREIGN KEY ("allowed_area_id") REFERENCES "public"."allowed_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_exit_recorded_by_id_users_id_fk" FOREIGN KEY ("exit_recorded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_vehicle_access_log_id_access_log_vehicles_id_fk" FOREIGN KEY ("vehicle_access_log_id") REFERENCES "public"."access_log_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_planned_access_id_planned_accesses_id_fk" FOREIGN KEY ("planned_access_id") REFERENCES "public"."planned_accesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_planned_access_person_id_planned_access_persons_id_fk" FOREIGN KEY ("planned_access_person_id") REFERENCES "public"."planned_access_persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_external_worker_id_external_workers_id_fk" FOREIGN KEY ("external_worker_id") REFERENCES "public"."external_workers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_work_permit_id_work_permits_id_fk" FOREIGN KEY ("work_permit_id") REFERENCES "public"."work_permits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_document_id_worker_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."worker_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_workers" ADD CONSTRAINT "external_workers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_workers" ADD CONSTRAINT "external_workers_work_category_id_work_categories_id_fk" FOREIGN KEY ("work_category_id") REFERENCES "public"."work_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_access_person_decisions" ADD CONSTRAINT "planned_access_person_decisions_planned_access_person_id_planned_access_persons_id_fk" FOREIGN KEY ("planned_access_person_id") REFERENCES "public"."planned_access_persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_access_person_decisions" ADD CONSTRAINT "planned_access_person_decisions_work_permit_id_work_permits_id_fk" FOREIGN KEY ("work_permit_id") REFERENCES "public"."work_permits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_access_person_decisions" ADD CONSTRAINT "planned_access_person_decisions_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_access_persons" ADD CONSTRAINT "planned_access_persons_work_category_id_work_categories_id_fk" FOREIGN KEY ("work_category_id") REFERENCES "public"."work_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_access_persons" ADD CONSTRAINT "planned_access_persons_allowed_area_id_allowed_areas_id_fk" FOREIGN KEY ("allowed_area_id") REFERENCES "public"."allowed_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_access_persons" ADD CONSTRAINT "planned_access_persons_planned_access_id_planned_accesses_id_fk" FOREIGN KEY ("planned_access_id") REFERENCES "public"."planned_accesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_access_persons" ADD CONSTRAINT "planned_access_persons_external_worker_id_external_workers_id_fk" FOREIGN KEY ("external_worker_id") REFERENCES "public"."external_workers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_accesses" ADD CONSTRAINT "planned_accesses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_accesses" ADD CONSTRAINT "planned_accesses_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_accesses" ADD CONSTRAINT "planned_accesses_decision_by_id_users_id_fk" FOREIGN KEY ("decision_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_accesses" ADD CONSTRAINT "planned_accesses_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_accesses" ADD CONSTRAINT "planned_accesses_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_accesses" ADD CONSTRAINT "planned_accesses_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_permit_activities" ADD CONSTRAINT "work_permit_activities_planned_access_id_planned_accesses_id_fk" FOREIGN KEY ("planned_access_id") REFERENCES "public"."planned_accesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_permit_activities" ADD CONSTRAINT "work_permit_activities_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_permit_activities" ADD CONSTRAINT "work_permit_activities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_permit_activities" ADD CONSTRAINT "work_permit_activities_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_permit_signatures" ADD CONSTRAINT "work_permit_signatures_work_permit_id_work_permits_id_fk" FOREIGN KEY ("work_permit_id") REFERENCES "public"."work_permits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_permit_signatures" ADD CONSTRAINT "work_permit_signatures_captured_by_id_users_id_fk" FOREIGN KEY ("captured_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_permits" ADD CONSTRAINT "work_permits_activity_id_work_permit_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."work_permit_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_permits" ADD CONSTRAINT "work_permits_planned_access_person_id_planned_access_persons_id_fk" FOREIGN KEY ("planned_access_person_id") REFERENCES "public"."planned_access_persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_permits" ADD CONSTRAINT "work_permits_external_worker_id_external_workers_id_fk" FOREIGN KEY ("external_worker_id") REFERENCES "public"."external_workers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_permits" ADD CONSTRAINT "work_permits_work_category_id_work_categories_id_fk" FOREIGN KEY ("work_category_id") REFERENCES "public"."work_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_permits" ADD CONSTRAINT "work_permits_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_permits" ADD CONSTRAINT "work_permits_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_documents" ADD CONSTRAINT "worker_documents_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_documents" ADD CONSTRAINT "worker_documents_work_category_id_work_categories_id_fk" FOREIGN KEY ("work_category_id") REFERENCES "public"."work_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_documents" ADD CONSTRAINT "worker_documents_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_documents" ADD CONSTRAINT "worker_documents_external_worker_id_external_workers_id_fk" FOREIGN KEY ("external_worker_id") REFERENCES "public"."external_workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "planned_access_person_decisions_person_idx" ON "planned_access_person_decisions" USING btree ("planned_access_person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "work_permit_signatures_type_idx" ON "work_permit_signatures" USING btree ("work_permit_id","signer_type");--> statement-breakpoint
CREATE UNIQUE INDEX "work_permits_activity_person_idx" ON "work_permits" USING btree ("activity_id","planned_access_person_id");