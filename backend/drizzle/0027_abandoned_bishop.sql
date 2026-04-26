ALTER TABLE "tbl_email_verfications" DROP CONSTRAINT "tbl_email_verfications_user_id_tbl_user_id_fk";
--> statement-breakpoint
ALTER TABLE "tbl_image" ADD COLUMN "preview_url" varchar NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "tbl_image" ADD COLUMN "waterMarked_url" varchar;--> statement-breakpoint
ALTER TABLE "tbl_email_verfications" ADD CONSTRAINT "tbl_email_verfications_user_id_tbl_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("id") ON DELETE cascade ON UPDATE no action;