ALTER TABLE "tbl_user_reset_tickets" ALTER COLUMN "expires_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tbl_user_reset_tickets" ADD COLUMN "is_url_accessed" boolean DEFAULT false NOT NULL;