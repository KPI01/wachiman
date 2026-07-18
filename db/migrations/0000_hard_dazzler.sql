CREATE TABLE `access_log_vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`type_snapshot` text NOT NULL,
	`brand_snapshot` text,
	`model_snapshot` text,
	`plate_snapshot` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `access_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_timestamp` text NOT NULL,
	`entry_signature_envelope` text NOT NULL,
	`exit_timestamp` text,
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
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`changed_by` text NOT NULL,
	`summary` text NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`cif` text DEFAULT '' NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`slug` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_slug_unique` ON `companies` (`slug`);--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `departments_slug_unique` ON `departments` (`slug`);--> statement-breakpoint
CREATE TABLE `external_workers` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`middle_name` text,
	`last_name` text NOT NULL,
	`second_last_name` text,
	`phone_number` text,
	`legal_id` text NOT NULL,
	`company_id` text NOT NULL,
	`work_category_id` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_category_id`) REFERENCES `work_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_workers_legal_id_unique` ON `external_workers` (`legal_id`);--> statement-breakpoint
CREATE TABLE `planned_access_persons` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name_snapshot` text NOT NULL,
	`middle_name_snapshot` text,
	`last_name_snapshot` text NOT NULL,
	`second_last_name_snapshot` text,
	`phone_number` text,
	`legal_id_snapshot` text NOT NULL,
	`planned_access_id` text NOT NULL,
	`external_worker_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`planned_access_id`) REFERENCES `planned_accesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`external_worker_id`) REFERENCES `external_workers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `planned_accesses` (
	`id` text PRIMARY KEY NOT NULL,
	`expected_start_datetime` text NOT NULL,
	`expected_end_datetime` text,
	`status` text DEFAULT 'PENDING_APPROVAL',
	`company_snapshot` text NOT NULL,
	`visit_reason` text NOT NULL,
	`approved_at` text,
	`approved_by_id` text NOT NULL,
	`requested_by_id` text NOT NULL,
	`site_id` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`address` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sites_slug_unique` ON `sites` (`slug`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'ACCESS_OPERATOR',
	`is_active` integer DEFAULT true,
	`is_trashed` integer DEFAULT false,
	`site_id` text NOT NULL,
	`department_id` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `work_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`requires_special_permission` integer DEFAULT false,
	`requires_training` integer DEFAULT false,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `worker_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`document_type` text NOT NULL,
	`status` text DEFAULT 'VALIDATED',
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer,
	`mime_type` text,
	`expiry_date` text NOT NULL,
	`notes` text,
	`external_worker_id` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`external_worker_id`) REFERENCES `external_workers`(`id`) ON UPDATE no action ON DELETE cascade
);
