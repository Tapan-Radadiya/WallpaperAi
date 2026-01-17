CREATE TABLE "tbl_email_verfications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_code" varchar NOT NULL,
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '10 minutes',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "tbl_email_verfications" ADD CONSTRAINT "tbl_email_verfications_user_id_tbl_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("id") ON DELETE no action ON UPDATE no action;