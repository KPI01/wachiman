ALTER TABLE "access_logs" ADD COLUMN "exit_signature_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "access_logs" ADD COLUMN "exit_signature_requested_by_id" text;--> statement-breakpoint
ALTER TABLE "access_logs" ADD COLUMN "exit_closure_method" text;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_exit_signature_requested_by_id_users_id_fk" FOREIGN KEY ("exit_signature_requested_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;