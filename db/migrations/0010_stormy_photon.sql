CREATE TABLE `planned_access_person_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`planned_access_person_id` text NOT NULL,
	`work_permit_id` text,
	`access_decision` text DEFAULT 'PENDING' NOT NULL,
	`work_decision` text DEFAULT 'PENDING' NOT NULL,
	`decision_reason` text,
	`decided_by_id` text,
	`decided_at` integer,
	`created_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	`updated_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	FOREIGN KEY (`planned_access_person_id`) REFERENCES `planned_access_persons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_permit_id`) REFERENCES `work_permits`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decided_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_permit_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`planned_access_id` text NOT NULL,
	`site_id` text NOT NULL,
	`company_id` text NOT NULL,
	`company_snapshot` text NOT NULL,
	`task_description` text NOT NULL,
	`work_area_snapshot` text NOT NULL,
	`expected_start_datetime` integer NOT NULL,
	`expected_end_datetime` integer,
	`risk_items` text NOT NULL,
	`tools_and_equipment` text NOT NULL,
	`personal_protective_equipment` text NOT NULL,
	`checklist` text NOT NULL,
	`incidents` text,
	`facility_risk_snapshot` text NOT NULL,
	`facility_risk_version` integer DEFAULT 0 NOT NULL,
	`created_by_id` text NOT NULL,
	`created_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	`updated_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	FOREIGN KEY (`planned_access_id`) REFERENCES `planned_accesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_permit_signatures` (
	`id` text PRIMARY KEY NOT NULL,
	`work_permit_id` text NOT NULL,
	`signer_type` text NOT NULL,
	`signer_name` text NOT NULL,
	`signer_legal_id` text,
	`signature_envelope` text NOT NULL,
	`captured_by_id` text NOT NULL,
	`signed_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	FOREIGN KEY (`work_permit_id`) REFERENCES `work_permits`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`captured_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_permits` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`planned_access_person_id` text NOT NULL,
	`external_worker_id` text,
	`first_name_snapshot` text NOT NULL,
	`last_name_snapshot` text NOT NULL,
	`legal_id_snapshot` text NOT NULL,
	`work_category_id` text NOT NULL,
	`restrictions` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`approved_by_id` text,
	`approved_at` integer,
	`approved_snapshot` text,
	`created_by_id` text NOT NULL,
	`created_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	`updated_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `work_permit_activities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`planned_access_person_id`) REFERENCES `planned_access_persons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`external_worker_id`) REFERENCES `external_workers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_category_id`) REFERENCES `work_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `access_logs` ADD `work_permit_id` text REFERENCES work_permits(id);--> statement-breakpoint
ALTER TABLE `work_categories` ADD `requires_work_permit` integer DEFAULT false;