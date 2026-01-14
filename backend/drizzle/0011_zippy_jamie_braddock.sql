CREATE TABLE "tbl_image_downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_ip" varchar,
	"image_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "tbl_image_downloads" ADD CONSTRAINT "tbl_image_downloads_user_id_tbl_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_image_downloads" ADD CONSTRAINT "tbl_image_downloads_image_id_tbl_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."tbl_image"("id") ON DELETE no action ON UPDATE no action;