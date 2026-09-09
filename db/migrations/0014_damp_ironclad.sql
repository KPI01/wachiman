ALTER TABLE `planned_access_persons` ADD `allowed_area_snapshot` text DEFAULT 'No especificada' NOT NULL;
--> statement-breakpoint
UPDATE `planned_access_persons`
SET `allowed_area_snapshot` = COALESCE(
  (SELECT `name` FROM `allowed_areas` WHERE `allowed_areas`.`id` = `planned_access_persons`.`allowed_area_id`),
  'No especificada'
)
WHERE `allowed_area_id` IS NOT NULL;
