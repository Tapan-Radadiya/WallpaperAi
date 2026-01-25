ALTER TABLE "tbl_user" RENAME COLUMN "display_name" TO "user_name";--> statement-breakpoint
ALTER TABLE "tbl_user" DROP CONSTRAINT "tbl_user_display_name_unique";--> statement-breakpoint
ALTER TABLE "tbl_user" ADD CONSTRAINT "tbl_user_user_name_unique" UNIQUE("user_name");