CREATE TABLE "tbl_image_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	CONSTRAINT "user-image-like-unique-constraint" UNIQUE("image_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "tbl_image_likes" ADD CONSTRAINT "tbl_image_likes_user_id_tbl_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_image_likes" ADD CONSTRAINT "tbl_image_likes_image_id_tbl_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."tbl_image"("id") ON DELETE no action ON UPDATE no action;