ALTER TABLE `access_logs` ADD `risk_acknowledged_at` integer;--> statement-breakpoint
ALTER TABLE `access_logs` ADD `risk_acknowledgement_snapshot` text;--> statement-breakpoint
ALTER TABLE `access_logs` ADD `company_id` text REFERENCES companies(id);--> statement-breakpoint
ALTER TABLE `app_settings` ADD `holder_legal_name` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `holder_tax_id` text;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `holder_fiscal_address` text;--> statement-breakpoint
ALTER TABLE `planned_accesses` ADD `company_id` text REFERENCES companies(id);--> statement-breakpoint
ALTER TABLE `sites` ADD `risk_information` text;--> statement-breakpoint
ALTER TABLE `sites` ADD `risk_information_version` integer DEFAULT 0 NOT NULL;