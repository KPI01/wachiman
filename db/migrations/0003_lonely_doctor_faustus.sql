PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_worker_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`document_type` text NOT NULL,
	`record_type` text DEFAULT 'TRAINING_EVIDENCE' NOT NULL,
	`status` text DEFAULT 'PENDING_REVIEW' NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer,
	`mime_type` text,
	`completed_at` integer,
	`issued_at` integer,
	`valid_from` integer,
	`expiry_date` integer,
	`refresher_due_at` integer,
	`review_due_at` integer,
	`last_performed_at` integer,
	`expiry_basis` text DEFAULT 'NOT_APPLICABLE' NOT NULL,
	`legal_source` text,
	`jurisdiction` text,
	`sector` text,
	`site_id` text,
	`work_category_id` text,
	`task_scope` text,
	`risk_scopes` text,
	`equipment_types` text,
	`procedure_version` text,
	`issuer` text,
	`employer_authorizer` text,
	`reviewed_by_id` text,
	`reviewed_at` integer,
	`review_reason` text,
	`supersedes_document_id` text,
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
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_category_id`) REFERENCES `work_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`external_worker_id`) REFERENCES `external_workers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_worker_documents`("id", "document_type", "record_type", "status", "file_name", "file_path", "file_size", "mime_type", "expiry_date", "expiry_basis", "notes", "external_worker_id", "created_at", "updated_at")
SELECT "id", "document_type",
	CASE "document_type"
		WHEN 'IDENTIFICATION' THEN 'IDENTITY_CREDENTIAL'
		WHEN 'SPECIAL_PERMISSION' THEN 'EMPLOYER_AUTHORIZATION'
		ELSE 'TRAINING_EVIDENCE'
	END,
	COALESCE("status", 'VALIDATED'), "file_name", "file_path", "file_size", "mime_type", "expiry_date", 'LEGACY_UNKNOWN', "notes", "external_worker_id", "created_at", "updated_at"
FROM `worker_documents`;--> statement-breakpoint
DROP TABLE `worker_documents`;--> statement-breakpoint
ALTER TABLE `__new_worker_documents` RENAME TO `worker_documents`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
