CREATE TABLE "tbl_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" varchar NOT NULL,
	"email_id" varchar NOT NULL,
	"avatar" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
