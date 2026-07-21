PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_access_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_timestamp` integer NOT NULL,
	`entry_signature_envelope` text NOT NULL,
	`exit_timestamp` integer,
	`exit_signature_envelope` text,
	`company_name_snapshot` text NOT NULL,
	`first_name_snapshot` text NOT NULL,
	`middle_name_snapshot` text,
	`last_name_snapshot` text NOT NULL,
	`second_last_name_snapshot` text,
	`phone_number` text,
	`legal_id_snapshot` text NOT NULL,
	`with_vehicle` integer DEFAULT false,
	`visit_reason` text NOT NULL,
	`site_id` text NOT NULL,
	`created_by_id` text NOT NULL,
	`exit_recorded_by_id` text,
	`vehicle_access_log_id` text,
	`planned_access_id` text,
	`planned_access_person_id` text,
	`external_worker_id` text,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exit_recorded_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vehicle_access_log_id`) REFERENCES `access_log_vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`planned_access_id`) REFERENCES `planned_accesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`planned_access_person_id`) REFERENCES `planned_access_persons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`external_worker_id`) REFERENCES `external_workers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_access_logs`("id", "entry_timestamp", "entry_signature_envelope", "exit_timestamp", "exit_signature_envelope", "company_name_snapshot", "first_name_snapshot", "middle_name_snapshot", "last_name_snapshot", "second_last_name_snapshot", "phone_number", "legal_id_snapshot", "with_vehicle", "visit_reason", "site_id", "created_by_id", "exit_recorded_by_id", "vehicle_access_log_id", "planned_access_id", "planned_access_person_id", "external_worker_id") SELECT "id", "entry_timestamp", "entry_signature_envelope", "exit_timestamp", "exit_signature_envelope", "company_name_snapshot", "first_name_snapshot", "middle_name_snapshot", "last_name_snapshot", "second_last_name_snapshot", "phone_number", "legal_id_snapshot", "with_vehicle", "visit_reason", "site_id", "created_by_id", "exit_recorded_by_id", "vehicle_access_log_id", "planned_access_id", "planned_access_person_id", "external_worker_id" FROM `access_logs`;--> statement-breakpoint
DROP TABLE `access_logs`;--> statement-breakpoint
ALTER TABLE `__new_access_logs` RENAME TO `access_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`changed_by` text NOT NULL,
	`summary` text NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_audit_logs`("id", "entity_type", "entity_id", "action", "changed_by", "summary", "metadata", "created_at") SELECT "id", "entity_type", "entity_id", "action", "changed_by", "summary", "metadata", "created_at" FROM `audit_logs`;--> statement-breakpoint
DROP TABLE `audit_logs`;--> statement-breakpoint
ALTER TABLE `__new_audit_logs` RENAME TO `audit_logs`;--> statement-breakpoint
CREATE TABLE `__new_companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`cif` text DEFAULT '' NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`slug` text NOT NULL,
	`created_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	`updated_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_companies`("id", "name", "cif", "address", "phone", "email", "slug", "created_at", "updated_at") SELECT "id", "name", "cif", "address", "phone", "email", "slug", "created_at", "updated_at" FROM `companies`;--> statement-breakpoint
DROP TABLE `companies`;--> statement-breakpoint
ALTER TABLE `__new_companies` RENAME TO `companies`;--> statement-breakpoint
CREATE UNIQUE INDEX `companies_slug_unique` ON `companies` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_departments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	`updated_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_departments`("id", "name", "slug", "created_at", "updated_at") SELECT "id", "name", "slug", "created_at", "updated_at" FROM `departments`;--> statement-breakpoint
DROP TABLE `departments`;--> statement-breakpoint
ALTER TABLE `__new_departments` RENAME TO `departments`;--> statement-breakpoint
CREATE UNIQUE INDEX `departments_slug_unique` ON `departments` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_external_workers` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`middle_name` text,
	`last_name` text NOT NULL,
	`second_last_name` text,
	`phone_number` text,
	`legal_id` text NOT NULL,
	`company_id` text NOT NULL,
	`work_category_id` text NOT NULL,
	`created_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	`updated_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_category_id`) REFERENCES `work_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_external_workers`("id", "first_name", "middle_name", "last_name", "second_last_name", "phone_number", "legal_id", "company_id", "work_category_id", "created_at", "updated_at") SELECT "id", "first_name", "middle_name", "last_name", "second_last_name", "phone_number", "legal_id", "company_id", "work_category_id", "created_at", "updated_at" FROM `external_workers`;--> statement-breakpoint
DROP TABLE `external_workers`;--> statement-breakpoint
ALTER TABLE `__new_external_workers` RENAME TO `external_workers`;--> statement-breakpoint
CREATE UNIQUE INDEX `external_workers_legal_id_unique` ON `external_workers` (`legal_id`);--> statement-breakpoint
CREATE TABLE `__new_planned_access_persons` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name_snapshot` text NOT NULL,
	`middle_name_snapshot` text,
	`last_name_snapshot` text NOT NULL,
	`second_last_name_snapshot` text,
	`phone_number` text,
	`legal_id_snapshot` text NOT NULL,
	`planned_access_id` text NOT NULL,
	`external_worker_id` text,
	`created_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	`updated_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	FOREIGN KEY (`planned_access_id`) REFERENCES `planned_accesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`external_worker_id`) REFERENCES `external_workers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_planned_access_persons`("id", "first_name_snapshot", "middle_name_snapshot", "last_name_snapshot", "second_last_name_snapshot", "phone_number", "legal_id_snapshot", "planned_access_id", "external_worker_id", "created_at", "updated_at") SELECT "id", "first_name_snapshot", "middle_name_snapshot", "last_name_snapshot", "second_last_name_snapshot", "phone_number", "legal_id_snapshot", "planned_access_id", "external_worker_id", "created_at", "updated_at" FROM `planned_access_persons`;--> statement-breakpoint
DROP TABLE `planned_access_persons`;--> statement-breakpoint
ALTER TABLE `__new_planned_access_persons` RENAME TO `planned_access_persons`;--> statement-breakpoint
CREATE TABLE `__new_planned_accesses` (
	`id` text PRIMARY KEY NOT NULL,
	`expected_start_datetime` integer NOT NULL,
	`expected_end_datetime` integer,
	`status` text DEFAULT 'PENDING_APPROVAL',
	`company_snapshot` text NOT NULL,
	`visit_reason` text NOT NULL,
	`approved_at` integer,
	`approved_by_id` text NOT NULL,
	`requested_by_id` text NOT NULL,
	`site_id` text NOT NULL,
	`created_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	`updated_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_planned_accesses`("id", "expected_start_datetime", "expected_end_datetime", "status", "company_snapshot", "visit_reason", "approved_at", "approved_by_id", "requested_by_id", "site_id", "created_at", "updated_at") SELECT "id", "expected_start_datetime", "expected_end_datetime", "status", "company_snapshot", "visit_reason", "approved_at", "approved_by_id", "requested_by_id", "site_id", "created_at", "updated_at" FROM `planned_accesses`;--> statement-breakpoint
DROP TABLE `planned_accesses`;--> statement-breakpoint
ALTER TABLE `__new_planned_accesses` RENAME TO `planned_accesses`;--> statement-breakpoint
CREATE TABLE `__new_sites` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`address` text,
	`created_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	`updated_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_sites`("id", "name", "slug", "address", "created_at", "updated_at") SELECT "id", "name", "slug", "address", "created_at", "updated_at" FROM `sites`;--> statement-breakpoint
DROP TABLE `sites`;--> statement-breakpoint
ALTER TABLE `__new_sites` RENAME TO `sites`;--> statement-breakpoint
CREATE UNIQUE INDEX `sites_slug_unique` ON `sites` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'ACCESS_OPERATOR',
	`is_active` integer DEFAULT true,
	`is_trashed` integer DEFAULT false,
	`site_id` text NOT NULL,
	`department_id` text NOT NULL,
	`created_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	`updated_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "full_name", "username", "password", "role", "is_active", "is_trashed", "site_id", "department_id", "created_at", "updated_at") SELECT "id", "full_name", "username", "password", "role", "is_active", "is_trashed", "site_id", "department_id", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `__new_work_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`requires_special_permission` integer DEFAULT false,
	`requires_training` integer DEFAULT false,
	`created_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	`updated_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_work_categories`("id", "name", "description", "requires_special_permission", "requires_training", "created_at", "updated_at") SELECT "id", "name", "description", "requires_special_permission", "requires_training", "created_at", "updated_at" FROM `work_categories`;--> statement-breakpoint
DROP TABLE `work_categories`;--> statement-breakpoint
ALTER TABLE `__new_work_categories` RENAME TO `work_categories`;--> statement-breakpoint
CREATE TABLE `__new_worker_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`document_type` text NOT NULL,
	`status` text DEFAULT 'VALIDATED',
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer,
	`mime_type` text,
	`expiry_date` integer NOT NULL,
	`notes` text,
	`external_worker_id` text NOT NULL,
	`created_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	`updated_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	FOREIGN KEY (`external_worker_id`) REFERENCES `external_workers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_worker_documents`("id", "document_type", "status", "file_name", "file_path", "file_size", "mime_type", "expiry_date", "notes", "external_worker_id", "created_at", "updated_at") SELECT "id", "document_type", "status", "file_name", "file_path", "file_size", "mime_type", "expiry_date", "notes", "external_worker_id", "created_at", "updated_at" FROM `worker_documents`;--> statement-breakpoint
DROP TABLE `worker_documents`;--> statement-breakpoint
ALTER TABLE `__new_worker_documents` RENAME TO `worker_documents`;