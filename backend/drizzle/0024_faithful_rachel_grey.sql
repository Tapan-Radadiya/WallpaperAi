CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'SUCCESS', 'FAILED');--> statement-breakpoint
CREATE TABLE "tbl_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" integer NOT NULL,
	"platform_cut" integer NOT NULL,
	"user_cut" integer NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tbl_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "user-purchases-image-unique-constraint" UNIQUE("image_id","buyer_id")
);
--> statement-breakpoint
ALTER TABLE "tbl_payments" ADD CONSTRAINT "tbl_payments_buyer_id_tbl_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."tbl_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_payments" ADD CONSTRAINT "tbl_payments_seller_id_tbl_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."tbl_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_payments" ADD CONSTRAINT "tbl_payments_image_id_tbl_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."tbl_image"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_purchases" ADD CONSTRAINT "tbl_purchases_buyer_id_tbl_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."tbl_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_purchases" ADD CONSTRAINT "tbl_purchases_image_id_tbl_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."tbl_image"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_purchases" ADD CONSTRAINT "tbl_purchases_payment_id_tbl_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."tbl_payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchases-idx" ON "tbl_purchases" USING btree ("buyer_id");