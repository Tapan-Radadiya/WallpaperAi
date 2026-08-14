ALTER TABLE "tbl_image" RENAME COLUMN "waterMarked_url" TO "waterMarked_preview_url";--> statement-breakpoint
ALTER TABLE "tbl_image" ADD COLUMN "waterMarked_thumbnail_url" varchar DEFAULT '';