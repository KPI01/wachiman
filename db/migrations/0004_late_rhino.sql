CREATE TABLE `document_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`decision` text NOT NULL,
	`reason` text NOT NULL,
	`evidence_snapshot` text NOT NULL,
	`reviewed_by_id` text NOT NULL,
	`reviewed_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `worker_documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_planned_accesses` (
	`id` text PRIMARY KEY NOT NULL,
	`expected_start_datetime` integer NOT NULL,
	`expected_end_datetime` integer,
	`status` text DEFAULT 'PENDING_APPROVAL',
	`company_snapshot` text NOT NULL,
	`visit_reason` text NOT NULL,
	`approved_at` integer,
	`approved_by_id` text,
	`decision_reason` text,
	`decision_at` integer,
	`decision_by_id` text,
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
	FOREIGN KEY (`decision_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_planned_accesses`("id", "expected_start_datetime", "expected_end_datetime", "status", "company_snapshot", "visit_reason", "approved_at", "approved_by_id", "decision_reason", "decision_at", "decision_by_id", "requested_by_id", "site_id", "created_at", "updated_at") SELECT "id", "expected_start_datetime", "expected_end_datetime", "status", "company_snapshot", "visit_reason", "approved_at", "approved_by_id", NULL, NULL, NULL, "requested_by_id", "site_id", "created_at", "updated_at" FROM `planned_accesses`;--> statement-breakpoint
DROP TABLE `planned_accesses`;--> statement-breakpoint
ALTER TABLE `__new_planned_accesses` RENAME TO `planned_accesses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `worker_documents` ADD `content_hash` text;
