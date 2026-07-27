CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`early_arrival_tolerance_minutes` integer DEFAULT 60 NOT NULL,
	`updated_by_id` text,
	`updated_at` integer DEFAULT (
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
  + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)
) NOT NULL,
	CONSTRAINT `app_settings_id_check` CHECK (`id` = 'global'),
	CONSTRAINT `app_settings_tolerance_check` CHECK (`early_arrival_tolerance_minutes` BETWEEN 0 AND 360),
	FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `app_settings` (`id`, `early_arrival_tolerance_minutes`)
VALUES ('global', 60)
ON CONFLICT (`id`) DO NOTHING;
