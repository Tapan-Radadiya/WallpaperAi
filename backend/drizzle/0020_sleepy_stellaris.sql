CREATE TABLE "aws_sqs_image_data_status" (
	"id" uuid DEFAULT gen_random_uuid(),
	"userId" uuid NOT NULL,
	"pushed_time" timestamp DEFAULT now(),
	"processed_time" timestamp,
	"deleted_time" timestamp,
	"messageGroupId" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "aws_sqs_image_data_status" ADD CONSTRAINT "aws_sqs_image_data_status_userId_tbl_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."tbl_user"("id") ON DELETE no action ON UPDATE no action;