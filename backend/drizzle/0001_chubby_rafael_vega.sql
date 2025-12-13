CREATE TABLE "tbl_image" (
	"id" uuid DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"category" varchar,
	"width" integer NOT NULL,
	"hashTags" varchar NOT NULL,
	"description" varchar NOT NULL,
	"thumbnail_url" varchar NOT NULL,
	"raw_url" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tbl_image" ADD CONSTRAINT "tbl_image_user_id_tbl_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("id") ON DELETE no action ON UPDATE no action;