-- Drop index only if it exists
DROP INDEX IF EXISTS "tbl_image_embeddings_tbl_image_idx";

-- Alter column type (no IF EXISTS support here, so wrap in DO block if needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tbl_image_embeddings' 
        AND column_name = 'image_metadata'
    ) THEN
        ALTER TABLE "tbl_image_embeddings"
        ALTER COLUMN "image_metadata" SET DATA TYPE vector(768);
    END IF;
END $$;

-- Add column only if it does not exist
ALTER TABLE "tbl_image"
ADD COLUMN IF NOT EXISTS "price" integer DEFAULT 0;

-- Create index only if it does not exist
CREATE INDEX IF NOT EXISTS "tbl_image_embeddings_tbl_image_idx"
ON "tbl_image_embeddings"
USING ivfflat ("image_metadata" vector_cosine_ops);