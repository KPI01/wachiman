CREATE TABLE `allowed_areas` (
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
CREATE UNIQUE INDEX `allowed_areas_name_unique` ON `allowed_areas` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `allowed_areas_slug_unique` ON `allowed_areas` (`slug`);--> statement-breakpoint
ALTER TABLE `access_logs` ADD `allowed_area_id` text REFERENCES allowed_areas(id);--> statement-breakpoint
ALTER TABLE `planned_access_persons` ADD `allowed_area_id` text REFERENCES allowed_areas(id);