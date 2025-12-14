ALTER TABLE "tbl_unsplash_images" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tbl_unsplash_images" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tbl_image" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "tbl_image" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "tbl_image_likes" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "tbl_image_likes" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "tbl_unsplash_images" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "tbl_unsplash_users" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "tbl_unsplash_users" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "tbl_user" ADD COLUMN "user_bio" varchar;--> statement-breakpoint
ALTER TABLE "tbl_user" ADD COLUMN "instagram_id" varchar;