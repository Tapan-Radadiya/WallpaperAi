CREATE TABLE "tbl_image_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tbl_image_id" uuid NOT NULL,
	"image_metadata" vector(3072),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tbl_image_embeddings" ADD CONSTRAINT "tbl_image_embeddings_tbl_image_id_tbl_image_id_fk" FOREIGN KEY ("tbl_image_id") REFERENCES "public"."tbl_image"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tbl_image_embeddings_tbl_image_idx" ON "tbl_image_embeddings" USING hnsw ("image_metadata" vector_cosine_ops);