CREATE TABLE "tbl_unsplash_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unsplash_user_id" varchar NOT NULL,
	"unsplash_id" varchar NOT NULL,
	"image_width" integer NOT NULL,
	"image_height" integer NOT NULL,
	"image_urls" jsonb,
	"alt_text" varchar NOT NULL,
	"description" varchar NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tbl_unsplash_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unsplash_user_id" varchar NOT NULL,
	"userName" varchar NOT NULL,
	"name" varchar NOT NULL,
	"portfolio_url" varchar NOT NULL,
	CONSTRAINT "tbl_unsplash_users_unsplash_user_id_unique" UNIQUE("unsplash_user_id")
);
--> statement-breakpoint
CREATE TABLE "tbl_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" varchar NOT NULL,
	"email_id" varchar NOT NULL,
	"avatar" varchar NOT NULL,
	"password" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "tbl_user_display_name_unique" UNIQUE("display_name"),
	CONSTRAINT "tbl_user_email_id_unique" UNIQUE("email_id")
);
--> statement-breakpoint
ALTER TABLE "tbl_unsplash_images" ADD CONSTRAINT "tbl_unsplash_images_unsplash_user_id_tbl_unsplash_users_unsplash_user_id_fk" FOREIGN KEY ("unsplash_user_id") REFERENCES "public"."tbl_unsplash_users"("unsplash_user_id") ON DELETE no action ON UPDATE no action;