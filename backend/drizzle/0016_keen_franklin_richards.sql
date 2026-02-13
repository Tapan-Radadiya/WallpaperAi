CREATE TABLE "tbl_user_reset_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"userTicket" varchar NOT NULL,
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '5 minutes',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tbl_user_reset_tickets" ADD CONSTRAINT "tbl_user_reset_tickets_user_id_tbl_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("id") ON DELETE no action ON UPDATE no action;